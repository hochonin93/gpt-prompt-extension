let inputDiv = null; // 用於存放輸入框的 DOM 元素
let pElement = null; // 用於存放 <p> 標籤元素
let suggestionBox = null; // 用於存放提示詞列表的容器
let prompts = []; // 提示詞列表，儲存可供選擇的提示詞
let selectedIndex = -1; // 用於追蹤當前選中的提示詞
let inputObserver = null; // 監視器變量

// 從存儲中加載提示詞列表
function loadPrompts(callback) {
  chrome.storage.sync.get(["prompts", "triggerSymbol"], function (result) {
    prompts = result.prompts || [];
    triggerSymbol = result.triggerSymbol || "!!"; // 默認為 "!!"
    if (callback) callback(); // 如果有回調函數，則執行它
  });
}

// 初始化時，載入提示詞列表
loadPrompts(function () {
  const observer = new MutationObserver((mutations, obs) => {
    const newInputDiv = document.getElementById("prompt-textarea");
    if (newInputDiv && newInputDiv !== inputDiv) {
      inputDiv = newInputDiv;
      initialize();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
});

// 網域判斷邏輯
const hostname = window.location.hostname;

if (hostname.includes("chatgpt.com")) {
  console.log("目前在 ChatGPT 網域");
  // ChatGPT 頁面的初始化邏輯
  loadPrompts(function () {
    const observer = new MutationObserver((mutations, obs) => {
      const newInputDiv = document.getElementById("prompt-textarea");
      if (newInputDiv && newInputDiv !== inputDiv) {
        inputDiv = newInputDiv;
        initialize();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  });
} else if (hostname.includes("gemini.google.com")) {
  console.log("目前在 Gemini Google 網域");
  // Gemini Google 頁面的初始化邏輯
  loadPrompts(function () {
    const observer = new MutationObserver((mutations, obs) => {
      const newInputDiv = document.querySelector(".ql-editor");
      if (newInputDiv && newInputDiv !== inputDiv) {
        inputDiv = newInputDiv;
        initialize();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
    });
  });
}

function initialize() {
  if (inputDiv) {
    // 移除舊的監聽器，避免重複綁定
    if (inputObserver) {
      inputObserver.disconnect();
    }

    inputDiv.addEventListener("input", onInput);
    inputDiv.addEventListener("keydown", onKeyDown); // 監聽鍵盤按鍵事件

    // 監聽 <p> 標籤的變化
    const config = { childList: true, subtree: true };
    inputObserver = new MutationObserver(() => {
      pElement = inputDiv.querySelector("p");
    });
    inputObserver.observe(inputDiv, config);
  }
}

// 函數：處理輸入事件
function onInput(e) {
  pElement = inputDiv.querySelector("p");

  if (!pElement) return;

  const value = pElement.innerText;

  if (value.endsWith(triggerSymbol)) {
    showSuggestions();
  } else {
    hideSuggestions();
  }
}

// 顯示提示詞!!
function showSuggestions() {
  if (!prompts || prompts.length === 0) {
    console.log("提示詞列表為空，無法顯示提示框");
    hideSuggestions(); // 如果沒有提示詞則隱藏提示框
    return;
  }

  // 始終重新創建 suggestionBox，避免使用 if (!suggestionBox)
  if (suggestionBox) {
    suggestionBox.remove(); // 移除之前的 suggestionBox
  }

  suggestionBox = document.createElement("div");
  suggestionBox.id = "suggestion-box";
  suggestionBox.className = "suggestion-box";

  let parentDiv = null;

  if (hostname.includes("chatgpt.com")) {
    parentDiv = inputDiv.closest(".flex.w-full.flex-col");
  } else if (hostname.includes("gemini.google.com")) {
    parentDiv = inputDiv.closest(".text-input-field");
  }

  if (parentDiv) {
    parentDiv.appendChild(suggestionBox);
  } else {
    document.body.appendChild(suggestionBox);
  }

  suggestionBox.innerHTML = ""; // 清空之前的提示框內容
  selectedIndex = -1; // 重置選擇索引

  prompts.forEach((prompt, index) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = prompt;

    // 為每個提示詞添加點擊事件
    item.addEventListener("click", () => {
      insertPrompt(prompt);
      hideSuggestions();
    });

    suggestionBox.appendChild(item); // 將提示詞項目添加到提示框
  });

  suggestionBox.style.display = "block"; // 顯示提示框
}

// 插入提示詞到輸入框
function insertPrompt(prompt) {
  pElement = inputDiv.querySelector("p");
  if (!pElement) return;

  let content = pElement.innerText;

  // 移除結尾的 "!!" 並插入提示詞
  const triggerRegex = new RegExp(triggerSymbol + "$");
  content = content.replace(triggerRegex, "") + prompt;

  // 更新 <p> 標籤內的內容
  pElement.innerText = content;

  // 將光標移動到內容末尾
  placeCaretAtEnd(pElement);
}

// 將光標移動到內容末尾
function placeCaretAtEnd(el) {
  el.focus();
  if (
    typeof window.getSelection != "undefined" &&
    typeof document.createRange != "undefined"
  ) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// 處理鍵盤事件
function onKeyDown(e) {
  if (!suggestionBox || suggestionBox.style.display === "none") return;

  const items = suggestionBox.querySelectorAll(".suggestion-item");

  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
    updateSelection(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    updateSelection(items);
  } else if (e.key === "Tab" && selectedIndex >= 0) {
    e.preventDefault();

    const selectedPrompt = items[selectedIndex].textContent
      .replace("使用 Tab 來選擇", "")
      .trim();
    insertPrompt(selectedPrompt);
    hideSuggestions();
  } else if (e.key === "Escape") {
    // 當按下 Escape 鍵時隱藏提示框
    hideSuggestions();
  }
}

// 更新選中狀態
function updateSelection(items) {
  items.forEach((item, index) => {
    const existingHint = item.querySelector(".tab-hint");
    if (existingHint) {
      existingHint.remove();
    }

    if (index === selectedIndex) {
      item.classList.add("selected");

      const tabHintDiv = document.createElement("div");
      tabHintDiv.className = "tab-hint";
      tabHintDiv.textContent = "使用 Tab 來選擇";
      tabHintDiv.style.float = "right";
      tabHintDiv.style.fontSize = "12px";
      tabHintDiv.style.color = "#888";
      tabHintDiv.style.marginLeft = "10px";

      item.appendChild(tabHintDiv);

      // 確保選中的項目滾動到可視範圍內
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else {
      item.classList.remove("selected");
    }
  });
}

// 隱藏提示詞列表
function hideSuggestions() {
  if (suggestionBox) {
    suggestionBox.style.display = "none";
  }
}

// 監聽存儲變化，實時更新提示詞列表
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.prompts) {
    prompts = changes.prompts.newValue || [];
  }
});
