<?php
// === Load Composer's autoloader ===
require 'vendor/autoload.php'; 

// === Import PHPMailer classes ===
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

session_start();
header('Content-Type: application/json');

// Database Configuration
$servername = "localhost";
$username = "root";
$password = ""; 
$dbname = "p_ticket_db";

// Database Connection Function
function getDbConnection() {
    global $servername, $username, $password, $dbname;
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
        die();
    }
    return $conn;
}

// === Email function using PHPMailer and SMTP ===
function sendEmail($toEmail, $toName, $subject, $body) {
    $mail = new PHPMailer(true);

    try {
        $mail->SMTPDebug = 0;                                      
        
        $mail->isSMTP();                                            
        $mail->Host       = 'smtp.gmail.com';                      
        $mail->SMTPAuth   = true;                                   
        $mail->Username   = 'tanjil01994087654@gmail.com';   
        $mail->Password   = 'hwed lump hgkc jusi';                     
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
        $mail->Port       = 587;                                    

        // --- Recipients ---
        $mail->setFrom('tanjil01994087654@gmail.com', 'P-Ticket System'); 
        $mail->addAddress($toEmail, $toName);                       

        // --- Content ---
        $mail->isHTML(true);                                        
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body);                         

        $mail->send();
        return true;
        
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
}

// Generate unique booking ID
function generateBookingId() {
    return 'PT' . date('Ymd') . strtoupper(substr(uniqid(), -6));
}

// Get action from URL
$action = $_GET['action'] ?? '';

// Get JSON data from request body
$data = json_decode(file_get_contents('php://input'), true);

// Connect to database
$conn = getDbConnection();

// Route handling
switch ($action) {
    
    // --- SIGNUP ---
    case 'signup':
        $name = trim($data['name'] ?? $data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        // Validation
        if (empty($name)) {
            echo json_encode(['success' => false, 'error' => 'Name is required.']);
            break;
        }

        if (empty($email)) {
            echo json_encode(['success' => false, 'error' => 'Email is required.']);
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'error' => 'Invalid email format.']);
            break;
        }

        if (empty($password)) {
            echo json_encode(['success' => false, 'error' => 'Password is required.']);
            break;
        }

        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters.']);
            break;
        }

        // Check if email already exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Database error.']);
            break;
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'error' => 'Email is already registered.']);
            $stmt->close();
            break;
        }
        $stmt->close();

        // Hash password and insert user
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Database error.']);
            break;
        }
        
        $stmt->bind_param("sss", $name, $email, $hashed_password);

        if ($stmt->execute()) {
            $user_id = $stmt->insert_id;
            
            // Set session
            $_SESSION['is_logged_in'] = true;
            $_SESSION['user_id'] = $user_id;
            $_SESSION['user_name'] = $name;

            // Send welcome email
            $emailBody = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { padding: 20px; background: #f9f9f9; }
                    .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
                    .content { background: white; padding: 20px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Welcome to P-Ticket!</h1>
                    </div>
                    <div class='content'>
                        <h2>Hello {$name}!</h2>
                        <p>Thank you for signing up with P-Ticket. We're excited to have you on board!</p>
                        <p>You can now book bus tickets easily and conveniently.</p>
                        <p>Best regards,<br>The P-Ticket Team</p>
                    </div>
                </div>
            </body>
            </html>
            ";
            
            $emailSent = sendEmail($email, $name, "Welcome to P-Ticket!", $emailBody);

            echo json_encode([
                'success' => true, 
                'name' => $name, 
                'email_sent' => $emailSent,
                'message' => 'Account created successfully!'
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Registration failed. Please try again.']);
        }
        $stmt->close();
        break;

    // --- LOGIN ---
    case 'login':
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        // Validation
        if (empty($email)) {
            echo json_encode(['success' => false, 'error' => 'Email is required.']);
            break;
        }

        if (empty($password)) {
            echo json_encode(['success' => false, 'error' => 'Password is required.']);
            break;
        }

        // Fetch user
        $stmt = $conn->prepare("SELECT id, name, password FROM users WHERE email = ?");
        
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Database error.']);
            break;
        }
        
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            if (password_verify($password, $user['password'])) {
                $_SESSION['is_logged_in'] = true;
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                echo json_encode(['success' => true, 'name' => $user['name']]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Invalid email or password.']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid email or password.']);
        }
        $stmt->close();
        break;

    // --- LOGOUT ---
    case 'logout':
        $_SESSION = array();
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time()-3600, '/');
        }
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    // --- CHECK SESSION ---
    case 'check_session':
        if (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in'] === true) {
            echo json_encode([
                'success' => true,
                'isLoggedIn' => true,
                'name' => $_SESSION['user_name'] ?? 'User'
            ]);
        } else {
            echo json_encode(['success' => true, 'isLoggedIn' => false]);
        }
        break;

    // --- PROCESS MOBILE PAYMENT (bKash/Nagad) ---
    case 'process_mobile_payment':
        if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
            echo json_encode(['success' => false, 'error' => 'Please login first.']);
            break;
        }

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $seats = $data['seats'] ?? [];
        $payment_method = $data['payment_method'] ?? '';
        $total_amount = floatval($data['total_amount'] ?? 0);
        $coupon = trim($data['coupon'] ?? '');
        $user_id = $_SESSION['user_id'];

        // Validation
        if (empty($name) || empty($email) || empty($phone)) {
            echo json_encode(['success' => false, 'error' => 'All fields are required.']);
            break;
        }

        if (empty($seats) || !is_array($seats)) {
            echo json_encode(['success' => false, 'error' => 'Please select at least one seat.']);
            break;
        }

        if (!in_array($payment_method, ['bkash', 'nagad', 'stripe', 'card'])) {
            echo json_encode(['success' => false, 'error' => 'Invalid payment method.']);
            break;
        }

        // Generate booking ID
        $booking_id = generateBookingId();
        $seats_string = implode(',', $seats);
        $booking_date = date('Y-m-d H:i:s');
        $route = 'Dhaka-Sylhet'; // Default route

        // Insert booking with all required fields
        $stmt = $conn->prepare("INSERT INTO bookings (booking_id, user_id, name, email, phone, seats, route, payment_method, total_amount, coupon, booking_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
        
        if (!$stmt) {
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
            break;
        }
        
        $stmt->bind_param("sissssssdss", $booking_id, $user_id, $name, $email, $phone, $seats_string, $route, $payment_method, $total_amount, $coupon, $booking_date);

        if ($stmt->execute()) {
            // Send confirmation email
            $paymentMethodUpper = strtoupper($payment_method);
            $emailBody = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { padding: 20px; background: #f9f9f9; }
                    .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
                    .content { background: white; padding: 20px; margin-top: 20px; }
                    .info { background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 15px 0; }
                    .footer { text-align: center; color: #666; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Booking Confirmed!</h1>
                    </div>
                    <div class='content'>
                        <h2>Hello {$name}!</h2>
                        <p>Your booking has been confirmed. Here are your booking details:</p>
                        
                        <div class='info'>
                            <strong>Booking ID:</strong> {$booking_id}<br>
                            <strong>Seat(s):</strong> {$seats_string}<br>
                            <strong>Total Amount:</strong> {$total_amount} BDT<br>
                            <strong>Payment Method:</strong> {$paymentMethodUpper}<br>
                            <strong>Route:</strong> Dhaka - Sylhet<br>
                            <strong>Departure:</strong> 9:00 PM<br>
                            <strong>Coach:</strong> 009-WEB | AC Business
                        </div>
                        
                        <h3>Payment Instructions:</h3>
                        <ol>
                            <li>Open your {$paymentMethodUpper} app</li>
                            <li>Send {$total_amount} BDT to: <strong>01700-000000</strong></li>
                            <li>Use reference: <strong>{$booking_id}</strong></li>
                            <li>Complete payment within 30 minutes</li>
                        </ol>
                        
                        <p>After payment verification, you'll receive your e-ticket via email.</p>
                        
                        <p class='footer'>Best regards,<br>The P-Ticket Team</p>
                    </div>
                </div>
            </body>
            </html>
            ";
            
            $emailSent = sendEmail($email, $name, "Booking Confirmed - {$booking_id}", $emailBody);

            echo json_encode([
                'success' => true,
                'booking' => [
                    'booking_id' => $booking_id,
                    'name' => $name,
                    'email' => $email,
                    'phone' => $phone,
                    'seats' => $seats_string,
                    'payment_method' => $payment_method,
                    'total_amount' => $total_amount,
                    'booking_date' => $booking_date
                ],
                'email_sent' => $emailSent,
                'message' => 'Booking confirmed successfully!'
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Booking failed. Please try again.']);
        }
        $stmt->close();
        break;

    // --- CREATE PAYMENT INTENT (for Stripe) ---
    case 'create_payment_intent':
        echo json_encode([
            'success' => false, 
            'error' => 'Payment processing temporarily unavailable. Please use bKash or Nagad.'
        ]);
        break;

    // --- DEFAULT (Unknown Action) ---
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid API action.']);
        break;
}

// Close the database connection
$conn->close();
?>