const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const analyzeButton = document.getElementById('analyzeButton');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const uploadSection = document.getElementById('uploadSection');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');

let uploadedFile = null; // To store the file object

// LogMeal User ID and API Key (updated with your provided values)
const LOGMEAL_USER_ID = '45807';
const LOGMEAL_API_KEY = 'ceb0c7e7600e08055ec79577ca5394d5697100';

// LogMeal endpoint for ingredient recognition
const LOGMEAL_INGREDIENT_API_URL = 'https://logmeal.com/api/recognition/ingredient-recognition';

// --- Debugging Check: Confirm elements are found ---
console.log("Element Check:");
console.log("imageUpload:", imageUpload);
console.log("imagePreview:", imagePreview);
console.log("analyzeButton:", analyzeButton);
console.log("resultSection:", resultSection);
console.log("uploadSection:", uploadSection);
console.log("errorMessage:", errorMessage);
console.log("loadingIndicator:", loadingIndicator);
// If any of these show 'null', it means the ID in your HTML doesn't match the ID here.
// This is a very common reason for elements not responding.


// Helper function to convert File to Base64
function fileToBase64(file) {
    console.log("fileToBase64 called for file:", file.name);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            console.log("FileReader loaded. Base64 data generated.");
            resolve(reader.result.split(',')[1]); // Get only the base64 part
        };
        reader.onerror = error => {
            console.error("FileReader error:", error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Handle file selection via input click
imageUpload.addEventListener('change', function(event) {
    console.log("Image upload input 'change' event triggered.");
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
    console.log("Drag & drop 'drop' event triggered.");
    handleFiles(event.dataTransfer.files);
});

function handleFiles(files) {
    console.log("handleFiles function called with", files.length, "files.");
    if (files.length > 0) {
        const file = files[0];
        console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size, "bytes.");

        if (file.type.startsWith('image/')) {
            uploadedFile = file; // Store the file
            const reader = new FileReader();

            reader.onload = function(e) {
                console.log("Image preview updated.");
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
            console.warn("Invalid file type detected:", file.type);
            uploadedFile = null;
            imagePreview.style.display = 'none';
            analyzeButton.disabled = true;
            errorMessage.textContent = 'Invalid file type. Please upload an image (JPG, PNG, GIF).';
            errorMessage.style.display = 'block';
        }
    } else {
        console.log("No files selected or dropped.");
        uploadedFile = null;
        imagePreview.style.display = 'none';
        analyzeButton.disabled = true;
        errorMessage.textContent = 'Please upload an image first.';
        errorMessage.style.display = 'block';
    }
}

analyzeButton.addEventListener('click', async function() {
    console.log("Analyze button clicked.");
    if (!uploadedFile) {
        errorMessage.textContent = 'No image selected for analysis.';
        errorMessage.style.display = 'block';
        console.warn("Analyze button clicked but no file uploaded.");
        return;
    }

    resultSection.style.display = 'block'; // Show the result section
    resultText.textContent = ''; // Clear previous text
    loadingIndicator.style.display = 'block'; // Show loading indicator
    analyzeButton.disabled = true; // Disable button during analysis
    errorMessage.style.display = 'none'; // Hide any errors

    try {
        // 1. Convert image to Base64
        resultText.textContent = 'Preparing image...';
        const base64ImageData = await fileToBase64(uploadedFile);
        console.log("Image converted to Base64.");

        // 2. Call LogMeal Ingredient Recognition API
        resultText.textContent = 'Identifying ingredients with LogMeal...';
        const logmealPayload = {
            "image": base64ImageData,
            "user_id": LOGMEAL_USER_ID,
            "api_key": LOGMEAL_API_KEY
        };
        console.log("Sending payload to LogMeal API:", logmealPayload);

        const logmealResponse = await fetch(LOGMEAL_INGREDIENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logmealPayload)
        });

        console.log("LogMeal API response received. Status:", logmealResponse.status);

        if (!logmealResponse.ok) {
            const errorBody = await logmealResponse.text(); // Capture the raw error response
            console.error("LogMeal API returned an error:", logmealResponse.status, errorBody);
            throw new Error(`LogMeal API error! Status: ${logmealResponse.status}. Response: ${errorBody}`);
        }
        const logmealResult = await logmealResponse.json();
        console.log("LogMeal API raw response (parsed):", logmealResult);

        let ingredientsList = "No ingredients identified.";

        if (logmealResult.results && logmealResult.results.length > 0 &&
            logmealResult.results[0].ingredients && logmealResult.results[0].ingredients.length > 0) {

            const recognizedIngredients = logmealResult.results[0].ingredients;
            const ingredientNames = recognizedIngredients.map(item => item.name);

            if (ingredientNames.length > 0) {
                ingredientsList = "<strong>Identified Ingredients:</strong><br>";
                ingredientsList += "<ul>";
                ingredientNames.forEach(name => {
                    ingredientsList += `<li>${name}</li>`;
                });
                ingredientsList += "</ul>";
            }
        } else if (logmealResult.status === "error") {
            // Handle specific LogMeal errors returned in the JSON body
            ingredientsList = `Error from LogMeal: ${logmealResult.message || 'Unknown API error'}`;
            resultText.style.color = 'red';
        } else {
             ingredientsList = `LogMeal API returned an unexpected response or no ingredients. Check console for raw response.`;
             resultText.style.color = '#ffc107'; // Yellow for caution
        }


        // 3. Display the identified ingredients
        resultText.innerHTML = ingredientsList;
        resultText.style.color = '#333'; // Reset color in case of previous error


    } catch (error) {
        console.error('Error during analysis:', error);
        resultText.textContent = `Error: An issue occurred during analysis. Please check your console for details. (${error.message})`;
        resultText.style.color = 'red';
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        analyzeButton.disabled = false; // Re-enable button
    }
});
