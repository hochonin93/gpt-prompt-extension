// options.js

document.addEventListener("DOMContentLoaded", function () {
  const promptList = document.getElementById("prompt-list");
  const addButton = document.getElementById("add-button");
  const newPromptInput = document.getElementById("new-prompt");
  const triggerInput = document.getElementById("trigger-input");
  const saveTriggerButton = document.getElementById("save-trigger-button");

  // 從存儲中加載觸發符號
  chrome.storage.sync.get(["triggerSymbol"], function (result) {
    triggerInput.value = result.triggerSymbol || "!!"; // 默認為 "!!"
  });

  // 保存觸發符號
  saveTriggerButton.addEventListener("click", function () {
    const newTriggerSymbol = triggerInput.value.trim();
    if (newTriggerSymbol) {
      chrome.storage.sync.set({ triggerSymbol: newTriggerSymbol }, function () {
        alert("觸發符號已保存!");
      });
    }
  });

  // 從存儲中加載提示詞列表
  function loadPrompts() {
    chrome.storage.sync.get(["prompts"], function (result) {
      const prompts = result.prompts || [];
      promptList.innerHTML = "";
      prompts.forEach((prompt, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = prompt;

        const buttonContainer = document.createElement("div");

        const editButton = document.createElement("button");
        editButton.textContent = "編輯";
        editButton.addEventListener("click", function () {
          editPrompt(index, prompt, li);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "删除";
        deleteButton.addEventListener("click", function () {
          deletePrompt(index);
        });

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        li.appendChild(span);
        li.appendChild(buttonContainer);
        promptList.appendChild(li);
      });
    });
  }

  // 添加新的提示詞
  addButton.addEventListener("click", function () {
    const newPrompt = newPromptInput.value.trim();
    if (newPrompt) {
      chrome.storage.sync.get(["prompts"], function (result) {
        const prompts = result.prompts || [];
        prompts.push(newPrompt);
        chrome.storage.sync.set({ prompts: prompts }, function () {
          newPromptInput.value = "";
          loadPrompts();
        });
      });
    }
  });

  // 删除提示詞
  function deletePrompt(index) {
    chrome.storage.sync.get(["prompts"], function (result) {
      const prompts = result.prompts || [];
      prompts.splice(index, 1);
      chrome.storage.sync.set({ prompts: prompts }, function () {
        loadPrompts();
      });
    });
  }

  // 編輯提示詞
  function editPrompt(index, currentPrompt, li) {
    // 創建輸入框
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentPrompt;
    input.style.flexGrow = "1";
    input.style.marginRight = "10px";

    // 創建保存按鈕
    const saveButton = document.createElement("button");
    saveButton.textContent = "保存";
    saveButton.addEventListener("click", function () {
      const newPrompt = input.value.trim();
      if (newPrompt) {
        chrome.storage.sync.get(["prompts"], function (result) {
          const prompts = result.prompts || [];
          prompts[index] = newPrompt;
          chrome.storage.sync.set({ prompts: prompts }, function () {
            loadPrompts();
          });
        });
      }
    });

    // 創建取消按鈕
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", function () {
      loadPrompts();
    });

    // 清空 li 並添加新的元素
    li.innerHTML = "";
    li.appendChild(input);
    li.appendChild(saveButton);
    li.appendChild(cancelButton);
  }

  const exportButton = document.getElementById("export-button");

  // 匯出提示詞成 JSON 檔案
  exportButton.addEventListener("click", function () {
    chrome.storage.sync.get(["prompts"], function (result) {
      const prompts = result.prompts || [];
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(prompts, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "prompts.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  });

  const importButton = document.getElementById("import-button");
  const importFileInput = document.getElementById("import-file");

  // 匯入提示詞功能
  importButton.addEventListener("click", function () {
    importFileInput.click();
  });

  // 當用戶選擇檔案後處理匯入
  importFileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const importedPrompts = JSON.parse(e.target.result);
          if (Array.isArray(importedPrompts)) {
            chrome.storage.sync.get(["prompts"], function (result) {
              const prompts = result.prompts || [];
              const mergedPrompts = [
                ...new Set([...prompts, ...importedPrompts]),
              ]; // 避免重複
              chrome.storage.sync.set({ prompts: mergedPrompts }, function () {
                alert("提示詞已成功匯入！");
                loadPrompts(); // 重新載入提示詞列表
              });
            });
          } else {
            alert("匯入的檔案格式不正確！");
          }
        } catch (error) {
          alert("解析匯入檔案時出錯！");
        }
      };
      reader.readAsText(file);
    }
  });

  // 初始化加載提示詞列表
  loadPrompts();
});
