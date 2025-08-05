// Popup functionality
document.addEventListener('DOMContentLoaded', function() {
    const enableToggle = document.getElementById('enableToggle');
    const promptsAnalyzed = document.getElementById('promptsAnalyzed');
    const suggestionsMade = document.getElementById('suggestionsMade');
    const improvements = document.getElementById('improvements');
    const feedbackLink = document.getElementById('feedbackLink');

    // Load saved settings
    chrome.storage.sync.get(['enabled', 'stats'], function(result) {
        if (result.enabled !== undefined) {
            enableToggle.classList.toggle('active', result.enabled);
        }
        
        if (result.stats) {
            promptsAnalyzed.textContent = result.stats.promptsAnalyzed || 0;
            suggestionsMade.textContent = result.stats.suggestionsMade || 0;
            improvements.textContent = `+${result.stats.improvements || 0}%`;
        }
    });

    // Toggle functionality
    enableToggle.addEventListener('click', function() {
        const isActive = enableToggle.classList.contains('active');
        enableToggle.classList.toggle('active', !isActive);
        
        // Save setting
        chrome.storage.sync.set({ enabled: !isActive });
        
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleEnabled',
                enabled: !isActive
            });
        });
    });

    // Feedback link
    feedbackLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({
            url: 'mailto:feedback@promptcraft.ai?subject=PromptCraft Extension Feedback'
        });
    });

    // Animate stats on load
    setTimeout(() => {
        animateCounter(promptsAnalyzed, 0, parseInt(promptsAnalyzed.textContent), 1000);
        animateCounter(suggestionsMade, 0, parseInt(suggestionsMade.textContent), 1200);
    }, 300);
});

function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * easeOutQuart(progress));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}