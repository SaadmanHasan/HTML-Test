const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const analyzeButton = document.getElementById('analyzeButton');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const uploadSection = document.getElementById('uploadSection');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');

let uploadedFile = null; // To store the file object

// IMPORTANT: Replace with your actual LogMeal User ID and API Key!
// For this Canvas environment, the API_KEY for Gemini is handled automatically.
// LogMeal keys MUST be provided by you.
const LOGMEAL_USER_ID = 'YOUR_LOGMEAL_USER_ID'; // <--- REPLACE THIS
const LOGMEAL_API_KEY = 'YOUR_LOGMEAL_API_KEY'; // <--- REPLACE THIS

const LOGMEAL_VISION_API_URL = 'https://logmeal.com/api/several-dishes-recognition/';
const GEMINI_LLM_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`; // API_KEY comes from Canvas environment

// Helper function to convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the base64 part
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Handle file selection via input click
imageUpload.addEventListener('change', function(event) {
    handleFiles(event.target.files);
});

// Prevent default drag behaviors
uploadSection.addEventListener('dragover', function(event) {
    event.preventDefault();
    uploadSection.style.backgroundColor = '#e9e9e9'; // Visual feedback on drag
});

uploadSection.addEventListener('dragleave', function(event) {
    event.preventDefault();
    uploadSection.style.backgroundColor = '#fff'; // Reset background
});

// Handle dropped files
uploadSection.addEventListener('drop', function(event) {
    event.preventDefault();
    uploadSection.style.backgroundColor = '#fff'; // Reset background
    handleFiles(event.dataTransfer.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            uploadedFile = file; // Store the file
            const reader = new FileReader();

            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block'; // Show the preview
                analyzeButton.disabled = false; // Enable the analyze button
                errorMessage.style.display = 'none'; // Hide any previous error
                resultSection.style.display = 'none'; // Hide previous result
                resultText.textContent = 'Waiting for an image to be analyzed...'; // Reset result text
                resultText.style.color = '#333'; // Reset result text color
                loadingIndicator.style.display = 'none'; // Hide loading indicator
            };
            reader.readAsDataURL(file);
        } else {
            uploadedFile = null;
            imagePreview.style.display = 'none';
            analyzeButton.disabled = true;
            errorMessage.textContent = 'Invalid file type. Please upload an image (JPG, PNG, GIF).';
            errorMessage.style.display = 'block';
        }
    } else {
        uploadedFile = null;
        imagePreview.style.display = 'none';
        analyzeButton.disabled = true;
        errorMessage.textContent = 'Please upload an image first.';
        errorMessage.style.display = 'block';
    }
}

analyzeButton.addEventListener('click', async function() {
    if (!uploadedFile) {
        errorMessage.textContent = 'No image selected for analysis.';
        errorMessage.style.display = 'block';
        return;
    }

    resultSection.style.display = 'block'; // Show the result section
    resultText.textContent = ''; // Clear previous text
    loadingIndicator.style.display = 'block'; // Show loading indicator
    analyzeButton.disabled = true; // Disable button during analysis
    errorMessage.style.display = 'none'; // Hide any errors

    try {
        // 1. Convert image to Base64
        const base64ImageData = await fileToBase64(uploadedFile);

        // 2. Call LogMeal Vision-to-Text API
        resultText.textContent = 'Analyzing image with LogMeal...';
        const logmealPayload = {
            "image": base64ImageData,
            "user_id": LOGMEAL_USER_ID,
            "api_key": LOGMEAL_API_KEY
        };

        const logmealResponse = await fetch(LOGMEAL_VISION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logmealPayload)
        });

        if (!logmealResponse.ok) {
            const errorBody = await logmealResponse.text(); // Get raw error response for debugging
            throw new Error(`LogMeal API error! Status: ${logmealResponse.status}. Response: ${errorBody}`);
        }
        const logmealResult = await logmealResponse.json();
        console.log("LogMeal API raw response:", logmealResult);

        let foodName = "Unknown Food";
        let foodDescription = "a food item";

        if (logmealResult.results && logmealResult.results.length > 0 &&
            logmealResult.results[0].food_items && logmealResult.results[0].food_items.length > 0) {
            const recognizedDishes = logmealResult.results[0].food_items;
            // Take the name of the first recognized dish as the primary food name
            foodName = recognizedDishes[0].name;

            // Create a more comprehensive description from all recognized dishes
            const dishNames = recognizedDishes.map(item => item.name);
            if (dishNames.length === 1) {
                foodDescription = `a dish identified as ${dishNames[0]}.`;
            } else if (dishNames.length > 1) {
                foodDescription = `dishes identified as ${dishNames.slice(0, -1).join(', ')} and ${dishNames[dishNames.length - 1]}.`;
            }

        } else {
            foodDescription = "Could not identify specific dishes from the image.";
            foodName = "Unidentified Food";
        }

        resultText.innerHTML = `Identified: <strong>${foodName}</strong><br>Description: ${foodDescription}<br><br>Getting health advice...`;


        // 3. Call LLM API for health advice (using Gemini as before)
        const llmPrompt = `Given the food '${foodName}' described as '${foodDescription}', explain in simple terms whether this food is generally healthy for senior people, considering common dietary needs and health conditions in old age. Provide a clear 'YES', 'NO', or 'VARIES' at the beginning of your answer, followed by a brief explanation.`;

        const llmPayload = {
            contents: [{ role: "user", parts: [{ text: llmPrompt }] }]
        };

        const llmResponse = await fetch(GEMINI_LLM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(llmPayload)
        });

        if (!llmResponse.ok) {
            throw new Error(`Gemini LLM API error! Status: ${llmResponse.status}`);
        }
        const llmResult = await llmResponse.json();
        console.log("Gemini LLM API raw response:", llmResult);

        let healthAdvice = "Could not get health advice.";
        let isHealthyFlag = "variable"; // Default

        if (llmResult.candidates && llmResult.candidates.length > 0 &&
            llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
            llmResult.candidates[0].content.parts.length > 0) {
            healthAdvice = llmResult.candidates[0].content.parts[0].text;

            // Determine health flag from the beginning of the LLM's response
            const lowerAdvice = healthAdvice.toLowerCase();
            if (lowerAdvice.startsWith('yes')) {
                isHealthyFlag = true;
            } else if (lowerAdvice.startsWith('no')) {
                isHealthyFlag = false;
            } else if (lowerAdvice.startsWith('varies')) {
                isHealthyFlag = "variable";
            }
        }

        // 4. Display result
        let displayMessage = `**Food: ${foodName}**<br><br>${healthAdvice}`;
        resultText.innerHTML = displayMessage;

        if (isHealthyFlag === true) {
            resultText.style.color = '#28a745'; // Green
        } else if (isHealthyFlag === false) {
            resultText.style.color = '#dc3545'; // Red
        } else {
            resultText.style.color = '#ffc107'; // Orange
        }

    } catch (error) {
        console.error('Error during analysis:', error);
        resultText.textContent = `Error: An issue occurred during analysis. Please check your console for details. (${error.message})`;
        resultText.style.color = 'red';
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        analyzeButton.disabled = false; // Re-enable button
    }
});
