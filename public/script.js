// ============================================
// DOM CONTENT LOADED - INITIALIZE APP
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // SPACE BACKGROUND - TWINKLING STARS
    // ============================================
    const starsContainer = document.getElementById('starsContainer');
    
    function createStars() {
        const starCount = 200; // Number of stars
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random size class
            const sizeClasses = ['small', 'small', 'small', 'medium', 'medium', 'large'];
            star.classList.add(sizeClasses[Math.floor(Math.random() * sizeClasses.length)]);
            
            // Random position
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            
            // Random twinkle duration and delay for variation
            const duration = 2 + Math.random() * 4; // 2-6 seconds
            const delay = Math.random() * 5; // 0-5 seconds delay
            star.style.setProperty('--twinkle-duration', duration + 's');
            star.style.animationDelay = delay + 's';
            
            starsContainer.appendChild(star);
        }
    }
    
    createStars();
    
    // Get form element
    const appointmentForm = document.getElementById('appointmentForm');
    
    // Set minimum date to today (prevent past date selection)
    const dateInput = document.getElementById('appointmentDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    // ============================================
    // INTERACTIVE BACKGROUND - GLITTER EFFECT
    // ============================================
    const glitterContainer = document.getElementById('glitterContainer');
    
    // Create random glitter particles periodically
    function createGlitter() {
        const particle = document.createElement('div');
        particle.className = 'glitter-particle';
        
        // Random position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '-10px';
        
        // Random size
        const size = Math.random() * 8 + 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // Random color from nail palette
        const colors = ['#f8b4c4', '#e91e63', '#e8d5f2', '#fce4ec', '#ff69b4', '#dda0dd'];
        particle.style.background = `radial-gradient(circle, #fff 0%, ${colors[Math.floor(Math.random() * colors.length)]} 50%, transparent 100%)`;
        
        // Random animation duration
        const duration = Math.random() * 5 + 5;
        particle.style.animationDuration = duration + 's';
        
        glitterContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    }
    
    // Create glitter every 300ms
    setInterval(createGlitter, 300);
    
    // ============================================
    // CLICK EFFECT ON BACKGROUND ELEMENTS
    // ============================================
    document.querySelectorAll('.nail-polish, .sparkle, .nail-art').forEach(element => {
        element.addEventListener('click', function(e) {
            // Create burst effect
            for (let i = 0; i < 10; i++) {
                const burst = document.createElement('div');
                burst.className = 'glitter-particle';
                burst.style.left = e.clientX + 'px';
                burst.style.top = e.clientY + 'px';
                burst.style.position = 'fixed';
                burst.style.animation = 'none';
                
                const angle = (i / 10) * Math.PI * 2;
                const velocity = 100 + Math.random() * 50;
                const dx = Math.cos(angle) * velocity;
                const dy = Math.sin(angle) * velocity;
                
                burst.style.transition = 'all 0.8s ease-out';
                document.body.appendChild(burst);
                
                setTimeout(() => {
                    burst.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
                    burst.style.opacity = '0';
                }, 10);
                
                setTimeout(() => burst.remove(), 800);
            }
        });
    });
    
    // ============================================
    // HERO SECTION GLITTER EFFECT
    // ============================================
    const heroGlitter = document.getElementById('heroGlitter');
    
    // Create static glitter particles for hero section
    function createHeroGlitter() {
        if (!heroGlitter) return;
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'glitter-particle';
            
            // Random position within hero section
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Random size
            const size = Math.random() * 4 + 2;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Random animation delay for staggered effect
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            heroGlitter.appendChild(particle);
        }
    }
    
    createHeroGlitter();
    
    // ============================================
    // FORM VALIDATION FUNCTIONS
    // ============================================
    
    /**
     * Validates email format using regex
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validates phone number format (10-15 digits)
     * @param {string} phone - Phone number to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    function isValidPhone(phone) {
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    /**
     * Validates the entire form
     * @returns {object} - Object containing isValid flag and error messages
     */
    function validateForm() {
        const errors = [];
        
        // Get form values
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const place = document.getElementById('place').value.trim();
        const appointmentDate = document.getElementById('appointmentDate').value;
        const appointmentTime = document.getElementById('appointmentTime').value;
        
        // Validate Full Name
        if (fullName.length < 2) {
            errors.push('Please enter a valid full name (at least 2 characters)');
        }
        
        // Validate Email
        if (!isValidEmail(email)) {
            errors.push('Please enter a valid email address');
        }
        
        // Validate Phone
        if (!isValidPhone(phone)) {
            errors.push('Please enter a valid phone number (10-15 digits)');
        }
        
        // Validate Place
        if (place.length < 2) {
            errors.push('Please enter a valid location');
        }
        
        // Validate Date
        if (!appointmentDate) {
            errors.push('Please select an appointment date');
        } else {
            const selectedDate = new Date(appointmentDate);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < todayDate) {
                errors.push('Appointment date cannot be in the past');
            }
        }
        
        // Validate Time
        if (!appointmentTime) {
            errors.push('Please select an appointment time');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Formats date for display
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {string} - Formatted date string
     */
    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    /**
     * Formats time for display
     * @param {string} timeString - Time string in HH:MM format
     * @returns {string} - Formatted time string
     */
    function formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }
    
    // ============================================
    // BOOKING SERVICE
    // ============================================
    
    /**
     * API Configuration
     */
    const API_CONFIG = {
        baseUrl: '',
        endpoints: {
            bookAppointment: '/api/book-appointment',
            checkStatus: '/api/status'
        },
        salonName: 'Clawed up Glam',
        salonPhone: '(555) 123-4567',
        salonAddress: '123 Beauty Lane, Glamour City'
    };

    /**
     * Book appointment - sends request to server
     */
    async function bookAppointment(appointmentData) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bookAppointment}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appointmentData: appointmentData
                })
            });
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('Booking API Error:', error);
            return {
                success: false,
                message: 'Unable to connect to booking server. Please try again later.'
            };
        }
    }

    /**
     * Check appointment status - polls server for approval status
     */
    async function checkAppointmentStatus(statusToken) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.checkStatus}/${statusToken}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Status check error:', error);
            return { success: false, status: 'pending' };
        }
    }

    /**
     * Poll for appointment approval status
     * @param {string} statusToken - The token to check status
     * @param {object} appointmentData - Original appointment data for display
     */
    function startStatusPolling(statusToken, appointmentData) {
        let pollCount = 0;
        const maxPolls = 720; // Poll for up to 1 hour (every 5 seconds)
        
        const pollInterval = setInterval(async () => {
            pollCount++;
            
            const statusResult = await checkAppointmentStatus(statusToken);
            
            if (statusResult.success && statusResult.status === 'approved') {
                clearInterval(pollInterval);
                
                // Show approval success
                Swal.fire({
                    icon: 'success',
                    title: 'Appointment Approved! 🎉',
                    html: `
                        <div style="text-align: center;">
                            <p style="color: #5a4a5a; margin-bottom: 20px;">
                                <strong>Your appointment has been confirmed!</strong>
                            </p>
                            
                            <div style="background: #e8f5e9; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                                <div style="font-size: 2.5rem; margin-bottom: 10px;">✓</div>
                                <p style="color: #4caf50; font-weight: 600; font-size: 16px; margin: 0;">
                                    Booking Confirmed!
                                </p>
                            </div>
                            
                            <div style="background: #fce4ec; padding: 15px; border-radius: 10px; text-align: left;">
                                <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${appointmentData.fullName}</p>
                                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formatDate(appointmentData.appointmentDate)}</p>
                                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formatTime(appointmentData.appointmentTime)}</p>
                                ${appointmentData.serviceType ? `<p style="margin: 5px 0;"><strong>💅 Service:</strong> ${appointmentData.serviceType}</p>` : ''}
                            </div>
                            
                            <div style="margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 10px;">
                                <p style="margin: 0; color: #1565c0; font-size: 14px;">
                                    📧 A confirmation email has been sent to ${appointmentData.email}
                                </p>
                            </div>
                            
                            <div style="margin-top: 15px; padding: 15px; background: #fff3e0; border-radius: 10px; border-left: 4px solid #ff9800;">
                                <p style="margin: 0; color: #e65100; font-size: 14px;">
                                    ⚠️ Please arrive 10-15 minutes early. For changes, call ${API_CONFIG.salonPhone}
                                </p>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'Done!',
                    confirmButtonColor: '#4caf50',
                    showClass: {
                        popup: 'animate__animated animate__bounceIn'
                    }
                }).then(() => {
                    appointmentForm.reset();
                    dateInput.setAttribute('min', today);
                });
                
            } else if (statusResult.success && statusResult.status === 'declined') {
                clearInterval(pollInterval);
                
                // Show declined message
                Swal.fire({
                    icon: 'error',
                    title: 'Appointment Declined',
                    html: `
                        <div style="text-align: center;">
                            <p style="color: #5a4a5a; margin-bottom: 20px;">
                                We're sorry, but your appointment request could not be accommodated at this time.
                            </p>
                            
                            ${statusResult.declineReason ? `
                                <div style="background: #ffebee; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                                    <p style="margin: 0; color: #c62828;"><strong>Reason:</strong> ${statusResult.declineReason}</p>
                                </div>
                            ` : ''}
                            
                            <div style="background: #e8f5e9; padding: 15px; border-radius: 10px;">
                                <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                                    Please try booking a different time slot, or contact us at ${API_CONFIG.salonPhone}
                                </p>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#e91e63'
                });
                
            } else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                
                // Timeout - still pending after max polls
                Swal.fire({
                    icon: 'info',
                    title: 'Still Pending',
                    html: `
                        <p>Your appointment is still awaiting approval.</p>
                        <p>You will receive an email notification once it's reviewed.</p>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#e91e63'
                });
            }
            
        }, 5000); // Poll every 5 seconds
        
        return pollInterval;
    }
    
    // ============================================
    // FORM SUBMISSION HANDLER
    // ============================================
    appointmentForm.addEventListener('submit', async function(event) {
        // Prevent page reload
        event.preventDefault();
        
        // Validate form
        const validation = validateForm();
        
        if (!validation.isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Oops!',
                html: validation.errors.map(err => `• ${err}`).join('<br>'),
                confirmButtonText: 'Fix Errors',
                confirmButtonColor: '#e91e63'
            });
            return;
        }
        
        // Get form data
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const place = document.getElementById('place').value.trim();
        const appointmentDate = document.getElementById('appointmentDate').value;
        const appointmentTime = document.getElementById('appointmentTime').value;
        const serviceType = document.getElementById('serviceType').value;
        const additionalNotes = document.getElementById('additionalNotes').value.trim();
        
        const appointmentData = {
            fullName,
            email,
            phone,
            place,
            appointmentDate,
            appointmentTime,
            serviceType,
            additionalNotes
        };
        
        // Show loading state
        Swal.fire({
            title: 'Booking Your Appointment...',
            html: `
                <div style="font-size: 3rem; margin-bottom: 15px;">💅</div>
                <p style="color: #5a4a5a;">Please wait while we confirm your appointment...</p>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Call the booking API
        const bookingResult = await bookAppointment(appointmentData);
        
        if (!bookingResult.success) {
            Swal.fire({
                icon: 'error',
                title: 'Booking Failed',
                text: bookingResult.message || 'Unable to book your appointment. Please try again.',
                confirmButtonColor: '#e91e63'
            });
            return;
        }
        
        // Show "Waiting for Approval" modal and start polling
        Swal.fire({
            icon: 'info',
            title: 'Waiting for Approval ⏳',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">
                        <span class="approval-spinner">💅</span>
                    </div>
                    
                    <p style="color: #5a4a5a; margin-bottom: 20px;">
                        <strong>Your appointment request has been submitted!</strong>
                    </p>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                        <p style="color: #e65100; font-weight: 600; margin: 0;">
                            Pending Admin Approval
                        </p>
                        <p style="color: #8d6e63; font-size: 14px; margin-top: 10px;">
                            The salon owner will review your request and you'll be notified by email.
                        </p>
                    </div>
                    
                    <div style="background: #fce4ec; padding: 15px; border-radius: 10px; text-align: left;">
                        <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${fullName}</p>
                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formatDate(appointmentDate)}</p>
                        <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formatTime(appointmentTime)}</p>
                        ${serviceType ? `<p style="margin: 5px 0;"><strong>💅 Service:</strong> ${serviceType}</p>` : ''}
                        <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${email}</p>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 10px;">
                        <p style="margin: 0; color: #1565c0; font-size: 13px;">
                            🔄 This page will auto-update when your booking is approved or declined.
                            <br>You can also close this and check your email.
                        </p>
                    </div>
                </div>
                
                <style>
                    .approval-spinner {
                        display: inline-block;
                        animation: spin 2s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Close & Wait for Email',
            confirmButtonColor: '#e91e63',
            allowOutsideClick: true,
            allowEscapeKey: true
        });
        
        // Start polling for status if we have a status token
        if (bookingResult.statusToken) {
            startStatusPolling(bookingResult.statusToken, appointmentData);
        }
    });
    
    // ============================================
    // REAL-TIME INPUT VALIDATION FEEDBACK
    // ============================================
    
    // Email validation on blur
    document.getElementById('email').addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.style.borderColor = '#ffb4b4';
        } else if (this.value) {
            this.style.borderColor = '#90EE90';
        }
    });
    
    // Phone validation on blur
    document.getElementById('phone').addEventListener('blur', function() {
        if (this.value && !isValidPhone(this.value)) {
            this.style.borderColor = '#ffb4b4';
        } else if (this.value) {
            this.style.borderColor = '#90EE90';
        }
    });
    
    // Reset border color on focus
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#f8b4c4';
        });
    });
    
    // ============================================
    // PHONE NUMBER INPUT FORMATTING
    // ============================================
    document.getElementById('phone').addEventListener('input', function() {
        // Remove any non-digit characters
        this.value = this.value.replace(/[^0-9]/g, '');
    });
    
});
