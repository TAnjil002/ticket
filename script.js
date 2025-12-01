// Generate seat layout
const seatContainer = document.getElementById('seat-container');
const totalPrice = document.getElementById('total-price');
const selectedSeat = document.getElementById('selected-seat');

let seatPrice = 550;
let selectedSeats = []; // Changed to array for multiple seats

// Store the publishable key (replace with your actual key)
const stripePublishableKey = 'pk_test_...'; // <-- REPLACE WITH YOUR STRIPE PUBLISHABLE KEY

let currentClientSecret = null;
let elements;
let stripe;

// Initialize Stripe
if (stripePublishableKey && stripePublishableKey !== 'pk_test_...') {
    stripe = Stripe(stripePublishableKey);
}

// NEW: Success notification function
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-[9999] transform transition-all duration-300';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Update seat display
function updateSeatDisplay() {
    if (selectedSeats.length === 0) {
        selectedSeat.textContent = 'None';
        totalPrice.textContent = '0';
    } else {
        selectedSeat.textContent = selectedSeats.sort((a, b) => a - b).join(', ');
        const currentPrice = seatPrice * selectedSeats.length;
        totalPrice.textContent = currentPrice;
        
        // Reapply coupon if exists
        const couponCode = document.getElementById('coupon').value.trim().toUpperCase();
        if (couponCode) {
            applyCouponDiscount(couponCode, currentPrice);
        }
    }
}

// Generate seats with multiple selection
if (seatContainer) {
    for (let i = 1; i <= 24; i++) {
        const seat = document.createElement('button');
        seat.textContent = i;
        seat.classList.add('seat-btn');
        seat.dataset.seatNumber = i;
        
        seat.addEventListener('click', () => {
            const seatNum = parseInt(seat.dataset.seatNumber);
            
            if (selectedSeats.includes(seatNum)) {
                // Deselect seat
                selectedSeats = selectedSeats.filter(s => s !== seatNum);
                seat.classList.remove('selected');
            } else {
                // Select seat (max 4 seats)
                if (selectedSeats.length >= 4) {
                    showSuccessNotification('You can select maximum 4 seats at a time');
                    return;
                }
                selectedSeats.push(seatNum);
                seat.classList.add('selected');
            }
            
            updateSeatDisplay();
            
            // If logged in and seats selected, enable payment
            if (selectedSeats.length > 0 && !document.getElementById('booking-form').classList.contains('hidden')) {
                document.getElementById('payment-method-section').classList.remove('hidden');
            }
        });
        
        seatContainer.appendChild(seat);
    }
}

// Apply coupon with discount calculation
function applyCouponDiscount(code, basePrice) {
    const couponMessage = document.getElementById('coupon-message');
    let discount = 0;
    
    if (code === 'NEW15') {
        discount = 0.15;
    } else if (code === 'COUPLE20') {
        discount = 0.20;
    }

    if (discount > 0) {
        const discounted = basePrice - (basePrice * discount);
        totalPrice.textContent = Math.round(discounted);
        couponMessage.textContent = `Coupon applied! ${(discount * 100)}% off - New price: ${Math.round(discounted)} BDT`;
        couponMessage.classList.remove('text-red-500');
        couponMessage.classList.add('text-green-600');
        return Math.round(discounted);
    } else if (code !== '') {
        couponMessage.textContent = 'Invalid coupon code!';
        couponMessage.classList.remove('text-green-600');
        couponMessage.classList.add('text-red-500');
        return basePrice;
    }
    
    couponMessage.textContent = '';
    return basePrice;
}

// Apply coupon
const applyCouponBtn = document.getElementById('apply-coupon');
if (applyCouponBtn) {
    applyCouponBtn.addEventListener('click', () => {
        const code = document.getElementById('coupon').value.trim().toUpperCase();
        const basePrice = seatPrice * selectedSeats.length;
        applyCouponDiscount(code, basePrice);
    });
}

// Smooth scroll to seat booking section
const buyTicketsBtn = document.getElementById('buy-tickets');
if (buyTicketsBtn) {
    buyTicketsBtn.addEventListener('click', function () {
        const seatSection = document.getElementById('seat-section');
        if (seatSection) {
            seatSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// --- LOGIN/LOGOUT SYSTEM ---
document.addEventListener('DOMContentLoaded', () => {
    // Modal elements
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    
    // Buttons
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Error messages
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    
    // Close buttons for modals
    const modalCloseBtns = document.querySelectorAll('.modal-close');

    // Navbar elements
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const welcomeMsg = document.getElementById('welcome-msg');

    // Booking section elements
    const bookingForm = document.getElementById('booking-form');
    const bookingLoginPrompt = document.getElementById('booking-login-prompt');
    const loginPromptBtn = document.getElementById('login-prompt-btn');
    const signupPromptBtn = document.getElementById('signup-prompt-btn');

    // Payment elements
    const paymentMethodBtns = document.querySelectorAll('.payment-method-btn');
    const stripePaymentSection = document.getElementById('stripe-payment-section');
    const mobilePaymentSection = document.getElementById('mobile-payment-section');
    const mobilePaymentForm = document.getElementById('mobile-payment-form');

    // --- Modal Toggle Functions ---
    const openModal = (modal) => modal.classList.remove('hidden');
    const closeModal = (modal) => modal.classList.add('hidden');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => openModal(loginModal));
    }
    if (signupBtn) {
        signupBtn.addEventListener('click', () => openModal(signupModal));
    }
    
    if (loginPromptBtn) {
        loginPromptBtn.addEventListener('click', () => openModal(loginModal));
    }
    if (signupPromptBtn) {
        signupPromptBtn.addEventListener('click', () => openModal(signupModal));
    }

    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(loginModal);
            closeModal(signupModal);
        });
    });

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal(loginModal);
        });
    }
    if (signupModal) {
        signupModal.addEventListener('click', (e) => {
            if (e.target === signupModal) closeModal(signupModal);
        });
    }

    // --- Payment Method Selection ---
    paymentMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method;
            
            // Update active button
            paymentMethodBtns.forEach(b => b.classList.remove('active-payment'));
            btn.classList.add('active-payment');
            
            // Show appropriate payment section
            if (method === 'stripe') {
                stripePaymentSection.classList.remove('hidden');
                mobilePaymentSection.classList.add('hidden');
                initializeStripePayment();
            } else {
                stripePaymentSection.classList.add('hidden');
                mobilePaymentSection.classList.remove('hidden');
                document.getElementById('selected-payment-method').value = method;
            }
        });
    });

    // --- Mobile Payment (bKash/Nagad) Handler ---
    if (mobilePaymentForm) {
        mobilePaymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (selectedSeats.length === 0) {
                alert('Please select at least one seat');
                return;
            }
            
            const name = document.getElementById('mobile-name').value;
            const email = document.getElementById('mobile-email').value;
            const phone = document.getElementById('mobile-phone').value;
            const paymentMethod = document.getElementById('selected-payment-method').value;
            const totalAmount = parseInt(totalPrice.textContent);
            const couponCode = document.getElementById('coupon').value.trim().toUpperCase();
            
            const bookingData = {
                name,
                email,
                phone,
                seats: selectedSeats,
                payment_method: paymentMethod,
                total_amount: totalAmount,
                coupon: couponCode
            };
            
            try {
                const response = await fetch('api.php?action=process_mobile_payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showSuccessNotification('Booking confirmed! Generating your ticket...');
                    
                    // Generate PDF ticket
                    setTimeout(() => {
                        generatePDFTicket(data.booking);
                        
                        // Clear selection
                        selectedSeats = [];
                        updateSeatDisplay();
                        document.querySelectorAll('#seat-container button').forEach(btn => 
                            btn.classList.remove('selected')
                        );
                        mobilePaymentForm.reset();
                    }, 1000);
                } else {
                    alert(data.error || 'Booking failed. Please try again.');
                }
            } catch (error) {
                console.error('Booking error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    // --- Update navbar based on login state ---
    const updateNavbar = (isLoggedIn, username) => {
        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userProfile.classList.add('flex');
            welcomeMsg.textContent = `Welcome, ${username}!`;
        } else {
            authButtons.classList.remove('hidden');
            userProfile.classList.add('hidden');
            userProfile.classList.remove('flex');
        }

        if (bookingForm && bookingLoginPrompt) {
            if (isLoggedIn) {
                bookingForm.classList.remove('hidden');
                bookingLoginPrompt.classList.add('hidden');
            } else {
                bookingForm.classList.add('hidden');
                bookingLoginPrompt.classList.remove('hidden');
            }
        }
    };

    // --- Stripe Payment Functions ---
    const initializeStripePayment = async () => {
        if (selectedSeats.length === 0) {
            return;
        }

        if (!stripe) {
            alert('Stripe payment not configured. Please use bKash or Nagad.');
            return;
        }

        const couponCode = document.getElementById('coupon').value.trim().toUpperCase();

        try {
            const response = await fetch('api.php?action=create_payment_intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    seats: selectedSeats,
                    coupon: couponCode 
                })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.error || 'Failed to initialize payment');
                return;
            }

            currentClientSecret = data.clientSecret;

            if (elements) {
                elements.destroy();
            }
            elements = stripe.elements({ clientSecret: currentClientSecret });
            const paymentElement = elements.create('payment');
            paymentElement.mount('#payment-element');

        } catch (error) {
            console.error('Error initializing payment:', error);
        }
    };

    // Handle Stripe Payment Submission
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!stripe || !elements) {
                return;
            }

            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;

            try {
                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: window.location.href.split('?')[0] + '?payment=success',
                        payment_method_data: {
                            billing_details: {
                                name: name,
                                email: email
                            }
                        }
                    },
                });

                if (error) {
                    alert(error.message || 'Payment failed');
                }
            } catch (error) {
                console.error('Payment error:', error);
            }
        });
    }

    // Check login state
    const checkLoginState = async () => {
        try {
            const response = await fetch('api.php?action=check_session', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success && data.isLoggedIn) {
                updateNavbar(true, data.name);
            } else {
                updateNavbar(false, null);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            updateNavbar(false, null);
        }
    };

    // Handle Sign Up
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            signupError.textContent = '';

            try {
                const response = await fetch('api.php?action=signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (data.success) {
                    updateNavbar(true, data.name);
                    closeModal(signupModal);
                    signupForm.reset();
                    
                    const emailStatus = data.email_sent ? ' A welcome email has been sent to your inbox.' : '';
                    showSuccessNotification(`Account created successfully!${emailStatus}`);
                } else {
                    signupError.textContent = data.error || 'Signup failed. Please try again.';
                }
            } catch (error) {
                console.error('Signup error:', error);
                signupError.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            loginError.textContent = '';

            try {
                const response = await fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    updateNavbar(true, data.name);
                    closeModal(loginModal);
                    loginForm.reset();
                    showSuccessNotification(`Welcome back, ${data.name}!`);
                } else {
                    loginError.textContent = data.error || 'Login failed. Please try again.';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginError.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('api.php?action=logout', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (data.success) {
                    updateNavbar(false, null);
                    selectedSeats = [];
                    updateSeatDisplay();
                    document.querySelectorAll('#seat-container button').forEach(btn => 
                        btn.classList.remove('selected')
                    );
                    showSuccessNotification('Logged out successfully!');
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    checkLoginState();
});

// --- PDF TICKET GENERATION ---
function generatePDFTicket(booking) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('P-TICKET', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Bus Ticket Booking Confirmation', 105, 30, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Booking Details
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Booking Details', 20, 55);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    let yPos = 70;
    const lineHeight = 10;
    
    doc.text(`Booking ID: ${booking.booking_id}`, 20, yPos);
    yPos += lineHeight;
    
    doc.text(`Passenger Name: ${booking.name}`, 20, yPos);
    yPos += lineHeight;
    
    doc.text(`Email: ${booking.email}`, 20, yPos);
    yPos += lineHeight;
    
    if (booking.phone) {
        doc.text(`Phone: ${booking.phone}`, 20, yPos);
        yPos += lineHeight;
    }
    
    doc.text(`Seat Number(s): ${booking.seats}`, 20, yPos);
    yPos += lineHeight;
    
    doc.text(`Total Amount: ${booking.total_amount} BDT`, 20, yPos);
    yPos += lineHeight;
    
    doc.text(`Payment Method: ${booking.payment_method.toUpperCase()}`, 20, yPos);
    yPos += lineHeight;
    
    doc.text(`Booking Date: ${new Date(booking.booking_date).toLocaleString()}`, 20, yPos);
    yPos += lineHeight + 10;
    
    // Journey Details
    doc.setFont(undefined, 'bold');
    doc.text('Journey Details', 20, yPos);
    yPos += lineHeight;
    
    doc.setFont(undefined, 'normal');
    doc.text('Route: Dhaka - Sylhet', 20, yPos);
    yPos += lineHeight;
    
    doc.text('Coach: 009-WEB | AC Business', 20, yPos);
    yPos += lineHeight;
    
    doc.text('Departure: 9:00 PM', 20, yPos);
    yPos += lineHeight;
    
    doc.text('Boarding: Gabtoli Inter-District Bus Terminal', 20, yPos);
    yPos += lineHeight + 15;
    
    // QR Code placeholder (you can integrate a real QR code library)
    doc.setFillColor(200, 200, 200);
    doc.rect(20, yPos, 40, 40, 'F');
    doc.setFontSize(8);
    doc.text('QR Code', 30, yPos + 20);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Please present this ticket at the boarding point', 105, 270, { align: 'center' });
    doc.text('Thank you for choosing P-Ticket!', 105, 280, { align: 'center' });
    
    // Save PDF
    doc.save(`P-Ticket-${booking.booking_id}.pdf`);
}