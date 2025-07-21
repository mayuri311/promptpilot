// blank for now

function underlineBuzzword(textarea) {
    const phrase = "Hello World";
    const value = textarea.value;

    if (value.includes(phrase)) {
        // highlight phrase in the ui
        const highlighted = value.replace(
            phrase,
            '[UNDERLINED] ${phrase} [/UNDERLINED]'
        );

        textarea.style.border = '2px solid red';
        console.log("Detected Hello World. Underlining...");
    } else {
        // remove highlight if phrase is not present
        textarea.style.border = '';
    }
}

function watchForBuzzwords() {
    const interval = setInterval(() => {
        const inputField = document.querySelector("textarea");
    
    if (inputField) {
        clearInterval(interval);

        inputField.addEventListener("input", () => {
            underlineBuzzword(inputField);
        });
    }
    }, 1000);
}

function createGrammarlyPopup() {
  let popup = document.getElementById("promptpilot-tooltip");
  if (!popup) {
    const popup = document.createElement("div");
    popup.id = "promptpilot-tooltip";
    popup.innerText = "Suggestion: Consider rephrasing 'Hello World'";
    Object.assign(popup.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      padding: "12px 20px",
      backgroundColor: "white",
      color: "#333",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
      fontSize: "14px",
      fontFamily: "sans-serif",
      zIndex: 99999,
      maxWidth: "250px"
    });
    document.body.appendChild(popup);
  }
  return popup;
}

function positionPopupNearInput(inputEl, popup) {
  const rect = inputEl.getBoundingClientRect();
  popup.style.top = `${rect.top - 50 + window.scrollY}px`;
  popup.style.left = `${rect.left + 10 + window.scrollX}px`;
}

function handleTyping(textarea) {
  const phrase = "Hello World";
  const value = textarea.value;
  const popup = createGrammarlyPopup();

  if (value.includes(phrase)) {
    popup.style.display = "block";
    positionPopupNearInput(textarea, popup);
  } else {
    popup.style.display = "none";
  }
}

function watchChatGPTInput() {
  const interval = setInterval(() => {
    const inputField = document.querySelector("textarea");

    if (inputField) {
      clearInterval(interval);

      inputField.addEventListener("input", () => {
        handleTyping(inputField);
      });

      inputField.addEventListener("blur", () => {
        const popup = document.getElementById("promptpilot-tooltip");
        if (popup) popup.style.display = "none";
      });
    }
  }, 1000);
}


// check just for chatgpt for now
if (window.location.hostname.includes("chatgpt.com")) {
    console.log("ChatGPT detected. Watching for buzzwords...");
    watchChatGPTInput();
}