// Beta Portal JavaScript
class BetaPortal {
    constructor() {
        this.currentUser = {
            username: 'YourUsername',
            level: 3,
            points: 1456,
            testsCompleted: 12,
            feedbackSubmitted: 8,
            bugsFound: 5
        };
        
        this.testScenarios = {
            'mobile-battle': {
                title: 'Mobile Battle System Test',
                description: 'Test the real-time battle system on mobile devices',
                steps: [
                    'Open the game on your mobile device',
                    'Join or start a battle between communities',
                    'Complete at least 3 challenges during the battle',
                    'Monitor performance and responsiveness',
                    'Report any issues with touch controls or lag'
                ],
                duration: 15,
                priority: 'high'
            },
            'challenge-balance': {
                title: 'Challenge Difficulty Balance',
                description: 'Evaluate the difficulty and fairness of different challenge types',
                steps: [
                    'Complete 5 puzzle challenges of different difficulties',
                    'Try 3 creative challenges (writing, art, memes)',
                    'Attempt 2 knowledge-based trivia challenges',
                    'Rate the difficulty and time required for each',
                    'Suggest improvements for balance'
                ],
                duration: 10,
                priority: 'medium'
            },
            'planet-visuals': {
                title: 'Planet Evolution Visual Test',
                description: 'Test the visual effects and animations of planet evolution',
                steps: [
                    'Contribute energy to evolve a planet from Stage 1 to Stage 2',
                    'Observe the visual transformation effects',
                    'Check particle effects and animations',
                    'Test on different devices and screen sizes',
                    'Report visual glitches or performance issues'
                ],
                duration: 5,
                priority: 'low'
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.loadRecentFeedback();
        this.startStatsAnimation();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                this.scrollToSection(target);
            });
        });

        // Hero buttons
        document.getElementById('start-testing')?.addEventListener('click', () => {
            this.scrollToSection('#testing');
        });

        document.getElementById('view-guide')?.addEventListener('click', () => {
            window.open('BETA_TESTING.md', '_blank');
        });

        // Test buttons
        document.querySelectorAll('.test-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', (e) => {
                    const testId = e.target.getAttribute('data-test');
                    if (testId) {
                        this.startTest(testId);
                    }
                });
            }
        });

        // Game launch
        document.getElementById('launch-game')?.addEventListener('click', () => {
            this.launchGame();
        });

        document.getElementById('view-changelog')?.addEventListener('click', () => {
            this.showChangelog();
        });

        // Feedback options
        document.querySelectorAll('.feedback-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                this.openFeedbackModal(type);
            });
        });

        // Refresh button
        document.getElementById('refresh-tests')?.addEventListener('click', () => {
            this.refreshTests();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Close modals on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Game preview play button
        document.querySelector('.play-overlay')?.addEventListener('click', () => {
            this.launchGame();
        });
    }

    scrollToSection(target) {
        const element = document.querySelector(target);
        if (element) {
            const headerHeight = document.querySelector('.beta-header').offsetHeight;
            const elementPosition = element.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    updateStats() {
        // Update hero stats with animation
        this.animateCounter('beta-testers', 247);
        this.animateCounter('communities', 12);
        this.animateCounter('feedback-count', 89);

        // Update progress bars
        this.updateProgressBar('Tests Completed', this.currentUser.testsCompleted, 20);
        this.updateProgressBar('Feedback Submitted', this.currentUser.feedbackSubmitted, 10);
        this.updateProgressBar('Bugs Found', this.currentUser.bugsFound, 5);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let currentValue = 0;
        const increment = targetValue / 50;
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue);
        }, 30);
    }

    updateProgressBar(label, current, max) {
        const progressItems = document.querySelectorAll('.progress-item');
        progressItems.forEach(item => {
            const labelEl = item.querySelector('.progress-label');
            if (labelEl && labelEl.textContent === label) {
                const fillEl = item.querySelector('.progress-fill');
                const valueEl = item.querySelector('.progress-value');
                const percentage = (current / max) * 100;
                
                if (fillEl) fillEl.style.width = `${percentage}%`;
                if (valueEl) valueEl.textContent = `${current}/${max}`;
            }
        });
    }

    startTest(testId) {
        const test = this.testScenarios[testId];
        if (!test) return;

        const modal = document.getElementById('test-modal');
        const title = document.getElementById('test-modal-title');
        const body = document.getElementById('test-modal-body');

        title.textContent = test.title;
        body.innerHTML = `
            <div class="test-scenario">
                <p class="test-description">${test.description}</p>
                <div class="test-details">
                    <div class="test-meta">
                        <span class="test-duration">⏱️ Estimated time: ${test.duration} minutes</span>
                        <span class="test-priority priority-${test.priority}">Priority: ${test.priority}</span>
                    </div>
                </div>
                <div class="test-steps">
                    <h4>Test Steps:</h4>
                    <ol>
                        ${test.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                <div class="test-actions">
                    <button class="test-action-btn secondary" onclick="betaPortal.closeModal(document.getElementById('test-modal'))">
                        Cancel
                    </button>
                    <button class="test-action-btn primary" onclick="betaPortal.executeTest('${testId}')">
                        Start Test
                    </button>
                </div>
            </div>
        `;

        this.showModal(modal);
    }

    executeTest(testId) {
        // Close the modal
        this.closeModal(document.getElementById('test-modal'));
        
        // Launch the actual game for testing
        this.launchGame();
        
        // Show test instructions overlay
        setTimeout(() => {
            this.showTestInstructions(testId);
        }, 2000);
    }

    showTestInstructions(testId) {
        const test = this.testScenarios[testId];
        
        // Create floating test instructions
        const instructions = document.createElement('div');
        instructions.className = 'test-instructions-overlay';
        instructions.innerHTML = `
            <div class="test-instructions">
                <h3>🧪 ${test.title}</h3>
                <p>Follow these steps and report your findings:</p>
                <ul>
                    ${test.steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
                <div class="test-timer">
                    <span>⏱️ Estimated time: ${test.duration} minutes</span>
                </div>
                <button class="close-instructions" onclick="this.parentElement.parentElement.remove()">
                    Got it! ✓
                </button>
            </div>
        `;
        
        document.body.appendChild(instructions);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (instructions.parentElement) {
                instructions.remove();
            }
        }, 30000);
    }

    launchGame() {
        // In a real implementation, this would launch the actual game
        // For now, we'll simulate it
        
        const gameWindow = window.open('index.html', 'RedditMindWars', 'width=1200,height=800');
        
        if (gameWindow) {
            // Show success message
            this.showNotification('🚀 Game launched! Complete your testing scenario and return here to submit feedback.', 'success');
        } else {
            // Show popup blocked message
            this.showNotification('❌ Popup blocked. Please allow popups and try again, or navigate to the game manually.', 'error');
        }
    }

    showChangelog() {
        const modal = document.getElementById('test-modal');
        const title = document.getElementById('test-modal-title');
        const body = document.getElementById('test-modal-body');

        title.textContent = 'Version 0.8.2-beta Changelog';
        body.innerHTML = `
            <div class="changelog">
                <div class="changelog-section">
                    <h4>🆕 New Features</h4>
                    <ul>
                        <li>Enhanced mobile touch controls for planet interaction</li>
                        <li>Improved battle synchronization system</li>
                        <li>New particle effects for planet evolution</li>
                        <li>Added accessibility options for screen readers</li>
                    </ul>
                </div>
                
                <div class="changelog-section">
                    <h4>🐛 Bug Fixes</h4>
                    <ul>
                        <li>Fixed challenge modal not responding on mobile Safari</li>
                        <li>Resolved memory leak in 3D rendering system</li>
                        <li>Fixed battle timer synchronization issues</li>
                        <li>Corrected planet scaling on high-DPI displays</li>
                    </ul>
                </div>
                
                <div class="changelog-section">
                    <h4>⚡ Performance Improvements</h4>
                    <ul>
                        <li>Reduced initial loading time by 40%</li>
                        <li>Optimized 3D rendering for low-end devices</li>
                        <li>Improved challenge generation speed</li>
                        <li>Enhanced server response times</li>
                    </ul>
                </div>
                
                <div class="changelog-section">
                    <h4>🎨 UI/UX Enhancements</h4>
                    <ul>
                        <li>Redesigned challenge difficulty indicators</li>
                        <li>Improved planet information display</li>
                        <li>Enhanced battle interface visibility</li>
                        <li>Added visual feedback for user actions</li>
                    </ul>
                </div>
            </div>
        `;

        this.showModal(modal);
    }

    openFeedbackModal(type) {
        const modal = document.getElementById('feedback-modal');
        const title = document.getElementById('feedback-modal-title');
        const body = document.getElementById('feedback-modal-body');

        const typeInfo = {
            bug: { title: '🐛 Report Bug', placeholder: 'Describe what went wrong and how to reproduce it...' },
            feature: { title: '✨ Suggest Feature', placeholder: 'Describe your feature idea and how it would improve the game...' },
            ui: { title: '🎨 UI/UX Feedback', placeholder: 'Share your thoughts on the design and user experience...' },
            performance: { title: '⚡ Performance Issue', placeholder: 'Describe the performance problem you encountered...' }
        };

        const info = typeInfo[type] || typeInfo.bug;
        title.textContent = info.title;

        body.innerHTML = `
            <form class="feedback-form" onsubmit="betaPortal.submitFeedback(event, '${type}')">
                <div class="form-group">
                    <label for="feedback-title">Title *</label>
                    <input type="text" id="feedback-title" required placeholder="Brief description of the issue/suggestion">
                </div>
                
                <div class="form-group">
                    <label for="feedback-severity">Severity</label>
                    <select id="feedback-severity" required>
                        <option value="low">Low - Minor issue</option>
                        <option value="medium" selected>Medium - Affects gameplay</option>
                        <option value="high">High - Major problem</option>
                        <option value="critical">Critical - Game breaking</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="feedback-description">Description *</label>
                    <textarea id="feedback-description" required rows="6" placeholder="${info.placeholder}"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="feedback-steps">Steps to Reproduce (for bugs)</label>
                    <textarea id="feedback-steps" rows="4" placeholder="1. Click on planet&#10;2. Select challenge&#10;3. Submit answer&#10;4. Error occurs"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="feedback-device">Device Information</label>
                    <input type="text" id="feedback-device" placeholder="e.g., iPhone 12, Chrome on Windows, etc." value="${this.getDeviceInfo()}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="form-btn secondary" onclick="betaPortal.closeModal(document.getElementById('feedback-modal'))">
                        Cancel
                    </button>
                    <button type="submit" class="form-btn primary">
                        Submit Feedback
                    </button>
                </div>
            </form>
        `;

        this.showModal(modal);
    }

    submitFeedback(event, type) {
        event.preventDefault();
        
        const formData = {
            type: type,
            title: document.getElementById('feedback-title').value,
            severity: document.getElementById('feedback-severity').value,
            description: document.getElementById('feedback-description').value,
            steps: document.getElementById('feedback-steps').value,
            device: document.getElementById('feedback-device').value,
            timestamp: new Date().toISOString(),
            user: this.currentUser.username
        };

        // Simulate API submission
        this.simulateFeedbackSubmission(formData);
        
        // Close modal
        this.closeModal(document.getElementById('feedback-modal'));
        
        // Show success message
        this.showNotification('✅ Feedback submitted successfully! Thank you for helping improve Reddit Mind Wars.', 'success');
        
        // Update user stats
        this.currentUser.feedbackSubmitted++;
        this.updateStats();
    }

    simulateFeedbackSubmission(data) {
        // In a real implementation, this would send to the server
        console.log('Feedback submitted:', data);
        
        // Store locally for demo purposes
        const existingFeedback = JSON.parse(localStorage.getItem('betaFeedback') || '[]');
        existingFeedback.unshift(data);
        localStorage.setItem('betaFeedback', JSON.stringify(existingFeedback.slice(0, 50))); // Keep last 50
        
        // Update the recent feedback display
        setTimeout(() => {
            this.loadRecentFeedback();
        }, 1000);
    }

    loadRecentFeedback() {
        // Load from localStorage for demo
        const feedback = JSON.parse(localStorage.getItem('betaFeedback') || '[]');
        
        // If no local feedback, use sample data
        if (feedback.length === 0) {
            this.loadSampleFeedback();
            return;
        }
        
        const feedbackList = document.querySelector('.feedback-list');
        if (!feedbackList) return;
        
        feedbackList.innerHTML = feedback.slice(0, 3).map(item => `
            <div class="feedback-item">
                <div class="feedback-avatar">${this.getTypeEmoji(item.type)}</div>
                <div class="feedback-content">
                    <div class="feedback-header">
                        <span class="feedback-user">${item.user}</span>
                        <span class="feedback-time">${this.getTimeAgo(item.timestamp)}</span>
                        <span class="feedback-type ${item.type}">${item.type}</span>
                    </div>
                    <p>${item.title}</p>
                    <div class="feedback-actions">
                        <button class="feedback-action">👍 ${Math.floor(Math.random() * 15) + 1}</button>
                        <button class="feedback-action">💬 Reply</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadSampleFeedback() {
        // Sample feedback data for demo
        const sampleFeedback = [
            {
                user: 'u/GamerPro123',
                type: 'bug',
                title: 'Battle timer doesn\'t sync properly on mobile Safari',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                user: 'u/DesignLover',
                type: 'feature',
                title: 'Planet customization could use more color options',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
                user: 'u/SpeedTester',
                type: 'performance',
                title: 'Loading time improved significantly in latest build!',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        localStorage.setItem('betaFeedback', JSON.stringify(sampleFeedback));
        this.loadRecentFeedback();
    }

    getTypeEmoji(type) {
        const emojis = {
            bug: '🐛',
            feature: '✨',
            ui: '🎨',
            performance: '⚡'
        };
        return emojis[type] || '💬';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours === 1) return '1h ago';
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    }

    getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Unknown Device';
        
        if (/iPhone/.test(ua)) device = 'iPhone';
        else if (/iPad/.test(ua)) device = 'iPad';
        else if (/Android/.test(ua)) device = 'Android';
        else if (/Windows/.test(ua)) device = 'Windows PC';
        else if (/Mac/.test(ua)) device = 'Mac';
        
        let browser = 'Unknown Browser';
        if (/Chrome/.test(ua)) browser = 'Chrome';
        else if (/Firefox/.test(ua)) browser = 'Firefox';
        else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
        else if (/Edge/.test(ua)) browser = 'Edge';
        
        return `${device}, ${browser}`;
    }

    refreshTests() {
        const btn = document.getElementById('refresh-tests');
        if (btn) {
            btn.innerHTML = '🔄';
            btn.style.animation = 'spin 1s linear infinite';
            
            setTimeout(() => {
                btn.innerHTML = '🔄';
                btn.style.animation = '';
                this.showNotification('✅ Test scenarios refreshed!', 'success');
            }, 1000);
        }
    }

    showModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    startStatsAnimation() {
        // Animate progress bars on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBars = entry.target.querySelectorAll('.progress-fill');
                    progressBars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0%';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                }
            });
        });

        const progressSection = document.querySelector('.testing-card');
        if (progressSection) {
            observer.observe(progressSection);
        }
    }
}

// Additional CSS for notifications and forms
const additionalStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(26, 26, 46, 0.95);
    border: 2px solid;
    border-radius: 0.5rem;
    padding: 1rem;
    z-index: 3000;
    max-width: 400px;
    backdrop-filter: blur(10px);
    animation: slideInRight 0.3s ease;
}

.notification.success {
    border-color: rgba(0, 255, 136, 0.5);
    background: rgba(0, 255, 136, 0.1);
}

.notification.error {
    border-color: rgba(255, 68, 68, 0.5);
    background: rgba(255, 68, 68, 0.1);
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    color: white;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2rem;
}

.test-instructions-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2500;
}

.test-instructions {
    background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
    border: 2px solid rgba(153, 50, 204, 0.5);
    border-radius: 1rem;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    color: white;
}

.test-instructions h3 {
    margin-bottom: 1rem;
    color: #9932cc;
}

.test-instructions ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
}

.test-instructions li {
    margin-bottom: 0.5rem;
    color: #e0e0e0;
}

.test-timer {
    margin: 1rem 0;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    text-align: center;
    color: #00ff88;
}

.close-instructions {
    width: 100%;
    background: linear-gradient(135deg, #9932cc, #8a2be2);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    margin-top: 1rem;
}

.feedback-form .form-group {
    margin-bottom: 1.5rem;
}

.feedback-form label {
    display: block;
    margin-bottom: 0.5rem;
    color: white;
    font-weight: 600;
}

.feedback-form input,
.feedback-form select,
.feedback-form textarea {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    font-family: inherit;
}

.feedback-form input:focus,
.feedback-form select:focus,
.feedback-form textarea:focus {
    outline: none;
    border-color: rgba(153, 50, 204, 0.5);
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

.form-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.form-btn.primary {
    background: linear-gradient(135deg, #9932cc, #8a2be2);
    color: white;
}

.form-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.test-action-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
}

.test-action-btn.primary {
    background: linear-gradient(135deg, #ff4500, #ff6b35);
    color: white;
}

.test-action-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.test-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
}

.changelog-section {
    margin-bottom: 2rem;
}

.changelog-section h4 {
    color: #00ff88;
    margin-bottom: 1rem;
}

.changelog-section ul {
    padding-left: 1.5rem;
}

.changelog-section li {
    margin-bottom: 0.5rem;
    color: #e0e0e0;
}

@keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the beta portal
const betaPortal = new BetaPortal();