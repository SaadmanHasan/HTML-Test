const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const analyzeButton = document.getElementById('analyzeButton');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const uploadSection = document.getElementById('uploadSection');
const errorMessage = document.getElementById('errorMessage');

let uploadedFile = null; // To store the file object

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

analyzeButton.addEventListener('click', function() {
    if (uploadedFile) {
        // In a real application, you would send 'uploadedFile' to your backend AI here.
        // For this frontend-only example, we'll simulate a result.
        resultSection.style.display = 'block'; // Show the result section
        resultText.textContent = 'Analyzing...'; // Indicate processing
        resultText.style.color = '#333'; // Reset color while analyzing

        // Simulate an API call with a delay
        setTimeout(() => {
            const randomNumber = Math.random();
            if (randomNumber < 0.5) {
                resultText.textContent = "This food appears to be healthy for seniors! (Simulated result)";
                resultText.style.color = '#28a745'; // Green for healthy
            } else {
                resultText.textContent = "This food might not be the healthiest choice for seniors. (Simulated result)";
                resultText.style.color = '#dc3545'; // Red for unhealthy
            }
        }, 2000); // Simulate a 2-second delay
    } else {
        errorMessage.textContent = 'No image selected for analysis.';
        errorMessage.style.display = 'block';
    }
});
