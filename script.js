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
const LOGMEAL_USER_ID = 'YOUR_LOGMEAL_USER_ID'; // <--- REPLACE THIS
const LOGMEAL_API_KEY = 'YOUR_LOGMEAL_API_KEY'; // <--- REPLACE THIS

// Updated LogMeal endpoint for ingredient recognition
const LOGMEAL_INGREDIENT_API_URL = 'https://logmeal.com/api/recognition/ingredient-recognition';


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

        // 2. Call LogMeal Ingredient Recognition API
        resultText.textContent = 'Identifying ingredients with LogMeal...';
        const logmealPayload = {
            "image": base64ImageData,
            "user_id": 45807,
            "api_key": 6cd288b6e53109b278ae76aa437e2383aee04d4d
        };

        const logmealResponse = await fetch(LOGMEAL_INGREDIENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logmealPayload)
        });

        if (!logmealResponse.ok) {
            const errorBody = await logmealResponse.text(); // Capture the raw error response
            throw new Error(`LogMeal API error! Status: ${logmealResponse.status}. Response: ${errorBody}`);
        }
        const logmealResult = await logmealResponse.json();
        console.log("LogMeal API raw response:", logmealResult);

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
