/**
 * LaunchList Embed Script
 * Add a waitlist form to any website with one line of code:
 * <script src="https://YOUR_DOMAIN/embed.js" data-project="YOUR_PROJECT_ID"></script>
 */
(function() {
  'use strict';

  // Find the script tag to get configuration
  const scripts = document.querySelectorAll('script[data-project]');
  const currentScript = scripts[scripts.length - 1];
  
  if (!currentScript) {
    console.error('LaunchList: Missing data-project attribute');
    return;
  }

  const projectSlug = currentScript.getAttribute('data-project');
  const apiKey = currentScript.getAttribute('data-api-key');
  const theme = currentScript.getAttribute('data-theme') || 'dark';
  const buttonText = currentScript.getAttribute('data-button-text') || 'Join Waitlist';
  const placeholder = currentScript.getAttribute('data-placeholder') || 'Enter your email';
  const containerId = currentScript.getAttribute('data-container');
  
  if (!projectSlug) {
    console.error('LaunchList: Missing data-project attribute');
    return;
  }

  if (!apiKey) {
    console.error('LaunchList: Missing data-api-key attribute. Please add data-api-key="YOUR_API_KEY" to the script tag.');
    return;
  }
  
  // API endpoint - will be set dynamically based on script location
  const API_URL = (function() {
    // Try to get from script src, fallback to current origin
    const scripts = document.querySelectorAll('script[src*="embed.js"]');
    if (scripts.length > 0) {
      const scriptSrc = scripts[scripts.length - 1].src;
      const url = new URL(scriptSrc);
      return url.origin + '/api/subscribe';
    }
    return window.location.origin + '/api/subscribe';
  })();

  // Styles
  const styles = `
    .ll-waitlist-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 400px;
      margin: 0 auto;
    }
    .ll-waitlist-form {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .ll-waitlist-input {
      flex: 1;
      min-width: 200px;
      padding: 12px 16px;
      font-size: 14px;
      border-radius: 8px;
      border: 1px solid ${theme === 'dark' ? '#333' : '#e5e5e5'};
      background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#000000'};
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .ll-waitlist-input:focus {
      border-color: #00d4aa;
      box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
    }
    .ll-waitlist-input::placeholder {
      color: ${theme === 'dark' ? '#666' : '#999'};
    }
    .ll-waitlist-button {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #00d4aa 0%, #00b894 100%);
      color: #000000;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .ll-waitlist-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
    }
    .ll-waitlist-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    .ll-waitlist-message {
      margin-top: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
    }
    .ll-waitlist-success {
      background: ${theme === 'dark' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(0, 212, 170, 0.1)'};
      color: #00d4aa;
      border: 1px solid rgba(0, 212, 170, 0.2);
    }
    .ll-waitlist-error {
      background: ${theme === 'dark' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 107, 107, 0.1)'};
      color: #ff6b6b;
      border: 1px solid rgba(255, 107, 107, 0.2);
    }
    .ll-waitlist-privacy {
      margin-top: 8px;
      font-size: 11px;
      color: ${theme === 'dark' ? '#666' : '#999'};
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ll-waitlist-privacy svg {
      width: 12px;
      height: 12px;
    }
    .ll-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: ll-spin 0.8s linear infinite;
      margin-right: 8px;
    }
    @keyframes ll-spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Create and inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create the form HTML
  const formHTML = `
    <div class="ll-waitlist-container" id="ll-waitlist-${projectSlug}">
      <form class="ll-waitlist-form" id="ll-form-${projectSlug}">
        <input 
          type="email" 
          class="ll-waitlist-input" 
          id="ll-email-${projectSlug}"
          placeholder="${placeholder}"
          required
          autocomplete="email"
        />
        <button type="submit" class="ll-waitlist-button" id="ll-button-${projectSlug}">
          ${buttonText}
        </button>
      </form>
      <div id="ll-message-${projectSlug}"></div>
      <div class="ll-waitlist-privacy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Privacy-first waitlist. No tracking.
      </div>
    </div>
  `;

  // Insert the form
  let container;
  if (containerId) {
    container = document.getElementById(containerId);
  }
  
  if (!container) {
    // Create container after the script tag
    container = document.createElement('div');
    currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
  }
  
  container.innerHTML = formHTML;

  // Handle form submission
  const form = document.getElementById(`ll-form-${projectSlug}`);
  const emailInput = document.getElementById(`ll-email-${projectSlug}`);
  const button = document.getElementById(`ll-button-${projectSlug}`);
  const messageDiv = document.getElementById(`ll-message-${projectSlug}`);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;

    // Get referral code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('referral');

    // Disable button and show loading
    button.disabled = true;
    button.innerHTML = '<span class="ll-spinner"></span>Joining...';
    messageDiv.innerHTML = '';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          email: email,
          ref: ref
        })
      });

      const data = await response.json();

      if (data.success) {
        let message = "You're on the list!";
        if (data.position) {
          message = "You're #" + data.position + " on the waitlist!";
        } else if (data.tier) {
          message = data.tier + " - You're on the list!";
        }
        
        if (data.message) {
          message = data.message;
        }

        // Show referral link
        if (data.referralCode) {
          const referralUrl = window.location.origin + window.location.pathname + '?ref=' + data.referralCode;
          message += '<br><small style="opacity: 0.8; margin-top: 8px; display: block;">Share to move up: <a href="' + referralUrl + '" style="color: inherit; text-decoration: underline;">' + referralUrl + '</a></small>';
        }

        messageDiv.innerHTML = '<div class="ll-waitlist-message ll-waitlist-success">' + message + '</div>';
        emailInput.value = '';
        button.innerHTML = 'Joined!';
        
        // Trigger custom event for analytics
        window.dispatchEvent(new CustomEvent('launchlist:signup', {
          detail: { email, position: data.position, referralCode: data.referralCode }
        }));
      } else {
        messageDiv.innerHTML = '<div class="ll-waitlist-message ll-waitlist-error">' + (data.error || 'Something went wrong') + '</div>';
        button.innerHTML = buttonText;
        button.disabled = false;
      }
    } catch (error) {
      messageDiv.innerHTML = '<div class="ll-waitlist-message ll-waitlist-error">Network error. Please try again.</div>';
      button.innerHTML = buttonText;
      button.disabled = false;
    }
  });
})();
