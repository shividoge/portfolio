<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

// CONFIGURATION
$to = "shivin.anand@gmail.com"; // Your email address here

// Only run if form submitted via POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Sanitize & validate inputs
    $name = filter_var(trim($_POST["name"] ?? ""), FILTER_SANITIZE_STRING);
    $email = filter_var(trim($_POST["email"] ?? ""), FILTER_SANITIZE_EMAIL);
    $subject = filter_var(trim($_POST["subject"] ?? ""), FILTER_SANITIZE_STRING);
    $message = filter_var(trim($_POST["comments"] ?? ""), FILTER_SANITIZE_STRING);

    if (!$name || !$email || !$subject || !$message) {
        echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Please enter a valid email address."]);
        exit;
    }

    // Prepare email
    $email_subject = "New Contact Form Message: $subject";
    $email_body = "Name: $name\n";
    $email_body .= "Email: $email\n";
    $email_body .= "Subject: $subject\n\n";
    $email_body .= "Message:\n$message\n";

    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";

    // Send email
    $success = mail($to, $email_subject, $email_body, $headers);

    if ($success) {
        echo json_encode(["success" => true, "message" => "Your message has been sent!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Something went wrong while sending the email."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request."]);
}
?>
