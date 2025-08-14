// options.js

document.addEventListener("DOMContentLoaded", () => {
  // Page elements
  const mainPage = document.getElementById("main-page");
  const editorPage = document.getElementById("rule-editor-page");
  const overridesList = document.getElementById("overrides-list");

  // Main page buttons
  const addNewRuleBtn = document.getElementById("add-new-rule-btn");

  // Rule editor page elements
  const editorTitle = document.getElementById("editor-title");
  const ruleIndexInput = document.getElementById("rule-index");
  const urlPatternInput = document.getElementById("url-pattern");
  const ruleEnabledSwitch = document.getElementById("rule-enabled-switch");
  const jsCodeInput = document.getElementById("js-code");
  const htmlInjectionsList = document.getElementById("html-injections-list");
  const addHtmlInjectionBtn = document.getElementById("add-html-injection-btn");
  const saveRuleBtn = document.getElementById("save-rule-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  // HTML injection modal elements
  const htmlModal = document.getElementById("html-injection-modal");
  const htmlModalTitle = document.getElementById("html-modal-title");
  const htmlInjectionForm = document.getElementById("html-injection-form");
  const htmlInjectionIndexInput = document.getElementById(
    "html-injection-index"
  );
  const htmlInjectionIdInput = document.getElementById("html-injection-id");
  const targetSelectorInput = document.getElementById("target-selector");
  const htmlCodeInput = document.getElementById("html-code");
  const previewContainer = document.getElementById("html-preview-container");
  const previewBox = document.getElementById("html-preview-box");
  const saveHtmlBtn = document.getElementById("save-html-injection-btn");
  const cancelHtmlBtn = document.getElementById("cancel-html-modal-btn");

  let currentHtmlInjections = []; // Temporary storage for HTML injection list when editing rules

  // --- Page Switching ---
  const showMainPage = () => {
    editorPage.style.display = "none";
    mainPage.style.display = "block";
    displayAllRules();
  };

  const showEditorPage = (rule = null, index = -1) => {
    ruleIndexInput.value = index;
    currentHtmlInjections = rule ? [...(rule.htmlInjections || [])] : [];

    if (rule) {
      editorTitle.textContent = "Edit Rule";
      urlPatternInput.value = rule.urlPattern || "";
      jsCodeInput.value = rule.jsCode || "";
      ruleEnabledSwitch.checked = rule.enabled;
    } else {
      editorTitle.textContent = "Add New Rule";
      urlPatternInput.value = "";
      jsCodeInput.value = "";
      ruleEnabledSwitch.checked = true; // New rules are enabled by default
    }

    renderHtmlInjectionsList();
    mainPage.style.display = "none";
    editorPage.style.display = "block";
  };

  // --- HTML Injection Modal Control ---
  const openHtmlModal = (injection = null, index = -1) => {
    htmlInjectionForm.reset();
    htmlInjectionIndexInput.value = index;
    previewContainer.style.display = "none"; // Hide preview

    if (injection) {
      htmlModalTitle.textContent = "Edit HTML Injection Rule";
      htmlInjectionIdInput.value = injection.id || "";
      targetSelectorInput.value = injection.querySelector || "";
      document.querySelector(
        `input[name="injectionType"][value="${
          injection.injectionType || "prepend"
        }"]`
      ).checked = true;
      htmlCodeInput.value = injection.htmlCode || "";
    } else {
      htmlModalTitle.textContent = "Add HTML Injection Rule";
      document.querySelector(
        'input[name="injectionType"][value="prepend"]'
      ).checked = true;
    }
    htmlModal.style.display = "flex";
  };

  const closeHtmlModal = () => {
    htmlModal.style.display = "none";
  };

  // --- Rendering Functions ---
  const renderHtmlInjectionsList = () => {
    htmlInjectionsList.innerHTML = "";
    if (currentHtmlInjections.length === 0) {
      htmlInjectionsList.innerHTML =
        '<p class="empty-list">No HTML injection rules.</p>';
      return;
    }
    currentHtmlInjections.forEach((injection, index) => {
      const item = document.createElement("div");
      item.className = "html-injection-item";
      item.innerHTML = `
              <div class="item-content">
                  <strong class="item-id">${escapeHTML(injection.id)}</strong>
                  <div class="item-details">
                      <span class="item-selector-display" title="${
                        escapeHTML(injection.querySelector) || "<body>"
                      }">${
        escapeHTML(injection.querySelector) || "&lt;body&gt;"
      }</span>
                      <span>${injection.injectionType}</span>
                  </div>
              </div>
              <div class="item-actions">
                  <button type="button" class="edit-html-btn" data-index="${index}">Edit</button>
                  <button type="button" class="delete-html-btn" data-index="${index}">Delete</button>
              </div>
          `;
      htmlInjectionsList.appendChild(item);
    });
  };

  const displayAllRules = async () => {
    overridesList.innerHTML = "";
    const { overrides = [] } = await chrome.storage.sync.get("overrides");

    if (overrides.length === 0) {
      overridesList.innerHTML =
        '<p class="empty-list">No saved rules. Click "Add New Rule" button to start.</p>';
      return;
    }

    overrides.forEach((override, index) => {
      const item = document.createElement("div");
      item.className = `override-item ${override.enabled ? "" : "disabled"}`;
      const htmlCount = override.htmlInjections?.length || 0;
      item.innerHTML = `
              <div class="item-content">
                  <strong class="item-url">${escapeHTML(
                    override.urlPattern
                  )}</strong>
                  <div class="item-details">
                      ${override.jsCode ? "<span>JS</span>" : ""}
                      ${
                        htmlCount > 0
                          ? `<span>HTML &times;${htmlCount}</span>`
                          : ""
                      }
                  </div>
              </div>
              <div class="item-actions">
                  <label class="switch">
                      <input type="checkbox" class="enable-switch" data-index="${index}" ${
        override.enabled ? "checked" : ""
      }>
                      <span class="slider"></span>
                  </label>
                  <button class="edit-rule-btn" data-index="${index}">Edit</button>
                  <button class="delete-rule-btn" data-index="${index}">Delete</button>
              </div>
          `;
      overridesList.appendChild(item);
    });
  };

  // --- Event Listeners ---
  addNewRuleBtn.addEventListener("click", () => showEditorPage());
  cancelEditBtn.addEventListener("click", showMainPage);
  addHtmlInjectionBtn.addEventListener("click", () => openHtmlModal());
  cancelHtmlBtn.addEventListener("click", closeHtmlModal);

  // Real-time HTML preview
  htmlCodeInput.addEventListener("input", () => {
    const htmlContent = htmlCodeInput.value;
    if (htmlContent.trim()) {
      previewBox.innerHTML = htmlContent;
      previewContainer.style.display = "block";
    } else {
      previewBox.innerHTML = "";
      previewContainer.style.display = "none";
    }
  });

  // Save All Rules
  saveRuleBtn.addEventListener("click", async () => {
    const index = parseInt(ruleIndexInput.value, 10);

    const rawJsCode = jsCodeInput.value.trim();
    const cleanedJsCode = extractJsFromHtml(rawJsCode);

    const newRule = {
      urlPattern: urlPatternInput.value.trim(),
      jsCode: cleanedJsCode,
      htmlInjections: currentHtmlInjections,
      enabled: ruleEnabledSwitch.checked,
    };

    if (!newRule.urlPattern) {
      alert("URL pattern is required.");
      return;
    }

    const { overrides = [] } = await chrome.storage.sync.get("overrides");
    if (index === -1) {
      overrides.push(newRule);
    } else {
      overrides[index] = newRule;
    }
    await chrome.storage.sync.set({ overrides });
    showMainPage();
  });

  // Temporarily save one HTML injection rule
  htmlInjectionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const index = parseInt(htmlInjectionIndexInput.value, 10);
    const newInjection = {
      id: htmlInjectionIdInput.value.trim(),
      querySelector: targetSelectorInput.value.trim(),
      injectionType: document.querySelector(
        'input[name="injectionType"]:checked'
      ).value,
      htmlCode: htmlCodeInput.value.trim(),
    };

    if (!newInjection.id) {
      alert("Injection rule ID is required.");
      return;
    }
    if (!newInjection.htmlCode) {
      alert("HTML code is required.");
      return;
    }

    if (index === -1) {
      currentHtmlInjections.push(newInjection);
    } else {
      currentHtmlInjections[index] = newInjection;
    }
    renderHtmlInjectionsList();
    closeHtmlModal();
  });

  // Rule list event delegation
  overridesList.addEventListener("click", async (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;

    const { overrides = [] } = await chrome.storage.sync.get("overrides");

    if (e.target.classList.contains("edit-rule-btn")) {
      showEditorPage(overrides[index], index);
    } else if (e.target.classList.contains("delete-rule-btn")) {
      if (
        confirm(
          `Are you sure you want to delete the rule '${overrides[index].urlPattern}'?`
        )
      ) {
        overrides.splice(index, 1);
        await chrome.storage.sync.set({ overrides });
        displayAllRules();
      }
    } else if (e.target.classList.contains("enable-switch")) {
      overrides[index].enabled = e.target.checked;
      await chrome.storage.sync.set({ overrides });
      e.target
        .closest(".override-item")
        .classList.toggle("disabled", !e.target.checked);
    }
  });

  // HTML injection list event delegation
  htmlInjectionsList.addEventListener("click", (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;

    if (e.target.classList.contains("edit-html-btn")) {
      openHtmlModal(currentHtmlInjections[index], index);
    } else if (e.target.classList.contains("delete-html-btn")) {
      currentHtmlInjections.splice(index, 1);
      renderHtmlInjectionsList();
    }
  });

  function escapeHTML(str) {
    if (!str) return "";
    const p = document.createElement("p");
    p.textContent = str;
    return p.innerHTML;
  }

  // Function to extract pure JS code from <script> tags
  function extractJsFromHtml(rawInput) {
    const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;
    const match = rawInput.match(scriptTagRegex);
    return match ? match[1].trim() : rawInput;
  }

  // Initialization
  showMainPage();
});
