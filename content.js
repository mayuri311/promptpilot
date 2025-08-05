// PromptCraft - AI Prompt Engineering Assistant
class PromptAnalyzer {
  constructor() {
    this.suggestions = [];
    this.isEnabled = true;
    this.currentTooltip = null;
    this.processedElements = new WeakSet();
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.injectStyles();
      this.observeTextFields();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('PromptCraft initialized successfully');
    } catch (error) {
      console.error('PromptCraft initialization error:', error);
    }
  }

  injectStyles() {
    if (document.getElementById('promptcraft-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'promptcraft-styles';
    style.textContent = `
      .pc-suggestion-highlight {
        background: linear-gradient(to bottom, transparent 0%, transparent 85%, #ff4444 85%, #ff4444 100%) !important;
        background-size: 1px 1em !important;
        background-repeat: repeat-x !important;
        position: relative !important;
        cursor: pointer !important;
      }
      
      .pc-tooltip {
        position: absolute;
        background: #1a1a1a;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        line-height: 1.4;
        border: 1px solid #333;
        backdrop-filter: blur(10px);
      }
      
      .pc-tooltip::before {
        content: '';
        position: absolute;
        top: -6px;
        left: 20px;
        width: 12px;
        height: 12px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-bottom: none;
        border-right: none;
        transform: rotate(45deg);
      }
      
      .pc-suggestion-title {
        font-weight: 600;
        color: #4CAF50;
        margin-bottom: 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .pc-suggestion-text {
        margin-bottom: 8px;
        color: #e0e0e0;
      }
      
      .pc-suggestion-example {
        background: #2a2a2a;
        padding: 8px;
        border-radius: 4px;
        font-style: italic;
        border-left: 3px solid #4CAF50;
        color: #b0b0b0;
      }
      
      .pc-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
        top: 0;
        left: 0;
      }
    `;
    document.head.appendChild(style);
  }

  observeTextFields() {
    // Use a more robust observer with error handling
    try {
      const observer = new MutationObserver((mutations) => {
        try {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.scanForTextFields(node);
              }
            });
          });
        } catch (error) {
          console.warn('PromptCraft observer error:', error);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Initial scan with delay to ensure DOM is ready
      setTimeout(() => {
        this.scanForTextFields(document.body);
      }, 1000);
      
    } catch (error) {
      console.error('PromptCraft observer setup failed:', error);
      // Fallback: just scan initially
      setTimeout(() => {
        this.scanForTextFields(document.body);
      }, 2000);
    }
  }

  scanForTextFields(container) {
    if (!container || !container.querySelectorAll) return;
    
    try {
      const selectors = [
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]',
        // ChatGPT specific selectors
        '#prompt-textarea',
        '[data-testid="textbox"]',
        // Claude specific selectors
        '.ProseMirror',
        // Generic AI chat selectors
        '[placeholder*="message" i]',
        '[placeholder*="prompt" i]',
        '[role="textbox"]'
      ];

      selectors.forEach(selector => {
        try {
          const elements = container.querySelectorAll(selector);
          elements.forEach(element => {
            if (!this.processedElements.has(element)) {
              this.attachToElement(element);
              this.processedElements.add(element);
            }
          });
        } catch (error) {
          console.warn(`PromptCraft selector error for ${selector}:`, error);
        }
      });
    } catch (error) {
      console.error('PromptCraft scan error:', error);
    }
  }

  attachToElement(element) {
    if (!element) return;
    
    try {
      let timeout;
      
      const handleInput = () => {
        try {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            this.analyzeText(element);
          }, 500); // Increased delay to reduce errors
        } catch (error) {
          console.warn('PromptCraft input handler error:', error);
        }
      };

      // Remove existing listeners to prevent duplicates
      element.removeEventListener('input', handleInput);
      element.removeEventListener('paste', handleInput);
      element.removeEventListener('focus', handleInput);
      
      // Add new listeners
      element.addEventListener('input', handleInput, { passive: true });
      element.addEventListener('paste', () => {
        setTimeout(handleInput, 50);
      }, { passive: true });
      element.addEventListener('focus', handleInput, { passive: true });
      
    } catch (error) {
      console.warn('PromptCraft attach error:', error);
    }
  }

  analyzeText(element) {
    if (!this.isEnabled || !element) return;

    try {
      const text = this.getElementText(element);
      if (!text || text.length < 5) return; // Skip very short text

      const issues = this.detectIssues(text);
      if (issues && issues.length > 0) {
        this.highlightIssues(element, issues);
      }
    } catch (error) {
      console.warn('PromptCraft analysis error:', error);
    }
  }

  getElementText(element) {
    try {
      if (!element) return '';
      
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return element.value || '';
      }
      return element.textContent || element.innerText || '';
    } catch (error) {
      console.warn('PromptCraft text extraction error:', error);
      return '';
    }
  }

  detectIssues(text) {
    if (!text || typeof text !== 'string') return [];
    
    const issues = [];

    try {
      // Rule 1: Too vague or unclear requests
      const vaguePatterns = [
        { pattern: /\b(help me|tell me about|what is|how do)\b/gi, type: 'vague' },
        { pattern: /\b(stuff|things|something|anything)\b/gi, type: 'vague' }
      ];

      // Check for very short prompts
      if (text.trim().length < 25) {
        issues.push({
          start: 0,
          end: text.length,
          type: 'vague',
          text: text.substring(0, 20),
          suggestion: 'Add more specific details to your request',
          example: 'Instead of short requests, explain exactly what you need and why.'
        });
      }

      vaguePatterns.forEach(({ pattern, type }) => {
        try {
          const matches = [...text.matchAll(pattern)];
          matches.forEach(match => {
            if (match && match.index !== undefined) {
              issues.push({
                start: match.index,
                end: match.index + match[0].length,
                type: type,
                text: match[0],
                suggestion: 'Be more specific about what you want',
                example: this.getVagueExample(match[0])
              });
            }
          });
        } catch (regexError) {
          console.warn('PromptCraft regex error:', regexError);
        }
      });

      // Rule 2: Missing context (simplified)
      if (text.length > 50 && !this.hasContext(text)) {
        issues.push({
          start: 0,
          end: Math.min(30, text.length),
          type: 'context',
          text: text.substring(0, 30),
          suggestion: 'Add context about your situation or goal',
          example: 'I\'m a [role] working on [project]. ' + text.substring(0, 30) + '...'
        });
      }

      // Rule 3: No specific output format requested (simplified)
      if (text.length > 30 && !this.hasOutputFormat(text)) {
        const endPos = Math.max(text.length - 20, 0);
        issues.push({
          start: endPos,
          end: text.length,
          type: 'format',
          text: text.substring(endPos),
          suggestion: 'Specify how you want the response formatted',
          example: text + ' Please format as a bulleted list.'
        });
      }

    } catch (error) {
      console.warn('PromptCraft detection error:', error);
    }

    return issues;
  }

  hasContext(text) {
    const contextKeywords = [
      'i am', 'i\'m', 'as a', 'for my', 'in my role', 'working on', 'project', 'task',
      'context:', 'background:', 'situation:', 'scenario:'
    ];
    return contextKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  hasOutputFormat(text) {
    const formatKeywords = [
      'list', 'bullet', 'numbered', 'table', 'format', 'structure',
      'organize', 'step by step', 'json', 'markdown', 'csv'
    ];
    return formatKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  hasRecentNoun(contextBefore) {
    const nounPattern = /\b[A-Z][a-z]+\b/g; // Simple noun detection
    const matches = contextBefore.match(nounPattern);
    return matches && matches.length > 0;
  }

  getVagueExample(vagueText) {
    const examples = {
      'help me': 'Help me create a 5-slide presentation about renewable energy for my college class',
      'tell me about': 'Explain the key differences between React and Vue.js for a beginner developer',
      'what is': 'What are the specific steps to implement OAuth 2.0 in a Node.js application?',
      'how do': 'How do I optimize MySQL queries for a table with 1M+ records?'
    };
    
    const lowerText = vagueText.toLowerCase();
    for (const [key, example] of Object.entries(examples)) {
      if (lowerText.includes(key)) {
        return example;
      }
    }
    
    return 'Be more specific about your exact need and desired outcome';
  }

  highlightIssues(element, issues) {
    try {
      this.removeExistingHighlights(element);
      
      if (!issues || issues.length === 0) return;

      // Simple visual feedback - add a colored border to the element
      if (element && element.style) {
        element.style.borderLeft = '3px solid #ff6b6b';
        element.style.borderRadius = '4px';
        
        // Add tooltip on hover
        element.title = `PromptCraft found ${issues.length} suggestion${issues.length > 1 ? 's' : ''}: ${issues[0].suggestion}`;
        
        // Create hover events for detailed tooltip
        element.addEventListener('mouseenter', (e) => {
          this.showTooltip(e, issues[0]);
        }, { passive: true });
        
        element.addEventListener('mouseleave', () => {
          this.hideTooltip();
        }, { passive: true });
      }
    } catch (error) {
      console.warn('PromptCraft highlighting error:', error);
    }
  }

  createOverlay(element) {
    let overlay = element.parentNode.querySelector('.pc-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'pc-overlay';
      element.parentNode.style.position = 'relative';
      element.parentNode.appendChild(overlay);
    }
    overlay.innerHTML = '';
    return overlay;
  }

  createHighlight(element, overlay, issue) {
    const rect = element.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Create highlight span
    const highlight = document.createElement('span');
    highlight.className = 'pc-suggestion-highlight';
    highlight.style.position = 'absolute';
    highlight.style.left = '0px';
    highlight.style.top = '0px';
    highlight.style.width = '100%';
    highlight.style.height = '20px';
    highlight.dataset.issue = JSON.stringify(issue);
    
    // Add hover events
    highlight.addEventListener('mouseenter', (e) => {
      this.showTooltip(e, issue);
    });
    
    highlight.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
    
    overlay.appendChild(highlight);
  }

  showTooltip(event, issue) {
    try {
      this.hideTooltip();
      
      const tooltip = document.createElement('div');
      tooltip.className = 'pc-tooltip';
      tooltip.style.position = 'fixed';
      tooltip.style.zIndex = '999999';
      
      tooltip.innerHTML = `
        <div class="pc-suggestion-title">${this.getIssueTitle(issue.type)}</div>
        <div class="pc-suggestion-text">${this.escapeHtml(issue.suggestion)}</div>
        <div class="pc-suggestion-example">${this.escapeHtml(issue.example)}</div>
      `;
      
      document.body.appendChild(tooltip);
      
      // Position tooltip safely
      const rect = event.target.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 10;
      
      // Keep tooltip on screen
      const tooltipRect = tooltip.getBoundingClientRect();
      if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      if (top + tooltipRect.height > window.innerHeight) {
        top = rect.top - tooltipRect.height - 10;
      }
      
      tooltip.style.left = `${Math.max(10, left)}px`;
      tooltip.style.top = `${Math.max(10, top)}px`;
      
      this.currentTooltip = tooltip;
    } catch (error) {
      console.warn('PromptCraft tooltip error:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  getIssueTitle(type) {
    const titles = {
      'vague': 'Too Vague',
      'context': 'Missing Context',
      'format': 'No Output Format',
      'ambiguous': 'Ambiguous Reference'
    };
    return titles[type] || 'Suggestion';
  }

  removeExistingHighlights(element) {
    try {
      if (element && element.style) {
        element.style.borderLeft = '';
        element.style.borderRadius = '';
        element.title = '';
      }
    } catch (error) {
      console.warn('PromptCraft cleanup error:', error);
    }
  }

  setupEventListeners() {
    // Listen for toggle shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggleEnabled();
      }
    }, { passive: false });

    // Clean up tooltips on scroll/resize
    window.addEventListener('scroll', () => this.hideTooltip(), { passive: true });
    window.addEventListener('resize', () => this.hideTooltip(), { passive: true });
    
    // Handle messages safely without Chrome runtime dependency
    this.setupMessageHandling();
  }

  setupMessageHandling() {
    try {
      // Only set up Chrome messaging if runtime is available and stable
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          try {
            if (request && request.action === 'toggleEnabled') {
              this.isEnabled = request.enabled !== false;
              if (!this.isEnabled) {
                this.cleanup();
              }
              sendResponse({ success: true });
            }
          } catch (error) {
            console.warn('PromptCraft message handling error:', error);
          }
          return true; // Keep message channel open
        });
      }
    } catch (error) {
      console.warn('PromptCraft Chrome runtime not available:', error);
      // Extension works fine without Chrome messaging
    }
  }

  // Safe Chrome storage access
  saveSettings() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({
          enabled: this.isEnabled,
          lastToggle: Date.now()
        }).catch(error => {
          console.warn('PromptCraft storage error:', error);
        });
      }
    } catch (error) {
      // Gracefully handle storage errors
      console.warn('PromptCraft storage not available:', error);
    }
  }

  cleanup() {
    try {
      // Remove all highlights
      document.querySelectorAll('[style*="border-left"]').forEach(el => {
        if (el.style.borderLeft.includes('ff6b6b')) {
          el.style.borderLeft = '';
          el.style.borderRadius = '';
          el.title = '';
        }
      });
      this.hideTooltip();
    } catch (error) {
      console.warn('PromptCraft cleanup error:', error);
    }
  }

  toggleEnabled() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.cleanup();
    }
    
    // Save settings safely
    this.saveSettings();
    
    console.log('PromptCraft', this.isEnabled ? 'enabled' : 'disabled');
    
    // Show brief status indicator
    this.showStatusIndicator(this.isEnabled ? 'PromptCraft Enabled' : 'PromptCraft Disabled');
  }

  showStatusIndicator(message) {
    try {
      const indicator = document.createElement('div');
      indicator.textContent = message;
      indicator.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #2d3748 !important;
        color: #81e6d9 !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        z-index: 999999 !important;
        border: 1px solid #4a5568 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      `;
      
      document.body.appendChild(indicator);
      
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 2000);
    } catch (error) {
      console.warn('PromptCraft status indicator error:', error);
    }
  }

}

// Safe initialization with error handling
function initializePromptCraft() {
  try {
    if (window.promptCraftInstance) {
      console.log('PromptCraft already initialized');
      return;
    }
    
    window.promptCraftInstance = new PromptAnalyzer();
    console.log('PromptCraft extension loaded! Press Ctrl+Shift+P to toggle.');
  } catch (error) {
    console.error('PromptCraft initialization failed:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePromptCraft);
} else {
  // DOM is already ready
  setTimeout(initializePromptCraft, 100);
}