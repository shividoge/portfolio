<?php
// CONFIGURATION
$to = "shivin.anand@gmail.com"; // ✅ Your email

// Only run if form submitted via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Send JSON header for response
    header('Content-Type: application/json; charset=utf-8');

    // Get values from POST & sanitize
    $name = trim($_POST["name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $subject = trim($_POST["subject"] ?? "");
    $message = trim($_POST["comments"] ?? "");

    // Basic validation
    if ($name && $email && $subject && $message) {
        // Build email
        $email_subject = "New Contact Form Message: $subject";
        $email_body = "Name: $name\n";
        $email_body .= "Email: $email\n";
        $email_body .= "Subject: $subject\n\n";
        $email_body .= "Message:\n$message\n";

        $headers = "From: $email\r\n";
        $headers .= "Reply-To: $email\r\n";

        // Send email
        $success = mail($to, $email_subject, $email_body, $headers);

        // Respond to JS/AJAX
        if ($success) {
            echo json_encode(["success" => true, "message" => "Your message has been sent!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Something went wrong while sending the email."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    }
} else {
    // Not a POST request
    echo json_encode(["success" => false, "message" => "Invalid request."]);
}
?>
