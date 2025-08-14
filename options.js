// options.js

document.addEventListener("DOMContentLoaded", () => {
  // 페이지 요소
  const mainPage = document.getElementById("main-page");
  const editorPage = document.getElementById("rule-editor-page");
  const overridesList = document.getElementById("overrides-list");

  // 메인 페이지 버튼
  const addNewRuleBtn = document.getElementById("add-new-rule-btn");

  // 규칙 편집 페이지 요소
  const editorTitle = document.getElementById("editor-title");
  const ruleIndexInput = document.getElementById("rule-index");
  const urlPatternInput = document.getElementById("url-pattern");
  const ruleEnabledSwitch = document.getElementById("rule-enabled-switch");
  const jsCodeInput = document.getElementById("js-code");
  const htmlInjectionsList = document.getElementById("html-injections-list");
  const addHtmlInjectionBtn = document.getElementById("add-html-injection-btn");
  const saveRuleBtn = document.getElementById("save-rule-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  // HTML 주입 모달 요소
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

  let currentHtmlInjections = []; // 규칙 편집 시 HTML 주입 목록 임시 저장

  // --- 페이지 전환 ---
  const showMainPage = () => {
    editorPage.style.display = "none";
    mainPage.style.display = "block";
    displayAllRules();
  };

  const showEditorPage = (rule = null, index = -1) => {
    ruleIndexInput.value = index;
    currentHtmlInjections = rule ? [...(rule.htmlInjections || [])] : [];

    if (rule) {
      editorTitle.textContent = "규칙 수정";
      urlPatternInput.value = rule.urlPattern || "";
      jsCodeInput.value = rule.jsCode || "";
      ruleEnabledSwitch.checked = rule.enabled;
    } else {
      editorTitle.textContent = "새 규칙 추가";
      urlPatternInput.value = "";
      jsCodeInput.value = "";
      ruleEnabledSwitch.checked = true; // 새 규칙은 기본적으로 활성화
    }

    renderHtmlInjectionsList();
    mainPage.style.display = "none";
    editorPage.style.display = "block";
  };

  // --- HTML 주입 모달 제어 ---
  const openHtmlModal = (injection = null, index = -1) => {
    htmlInjectionForm.reset();
    htmlInjectionIndexInput.value = index;
    previewContainer.style.display = "none"; // 미리보기 숨기기

    if (injection) {
      htmlModalTitle.textContent = "HTML 주입 규칙 수정";
      htmlInjectionIdInput.value = injection.id || "";
      targetSelectorInput.value = injection.querySelector || "";
      document.querySelector(
        `input[name="injectionType"][value="${
          injection.injectionType || "prepend"
        }"]`
      ).checked = true;
      htmlCodeInput.value = injection.htmlCode || "";
    } else {
      htmlModalTitle.textContent = "HTML 주입 규칙 추가";
      document.querySelector(
        'input[name="injectionType"][value="prepend"]'
      ).checked = true;
    }
    htmlModal.style.display = "flex";
  };

  const closeHtmlModal = () => {
    htmlModal.style.display = "none";
  };

  // --- 렌더링 함수 ---
  const renderHtmlInjectionsList = () => {
    htmlInjectionsList.innerHTML = "";
    if (currentHtmlInjections.length === 0) {
      htmlInjectionsList.innerHTML =
        '<p class="empty-list">HTML 주입 규칙이 없습니다.</p>';
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
                  <button type="button" class="edit-html-btn" data-index="${index}">수정</button>
                  <button type="button" class="delete-html-btn" data-index="${index}">삭제</button>
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
        '<p class="empty-list">저장된 규칙이 없습니다. "새 규칙 추가" 버튼을 눌러 시작하세요.</p>';
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
                  <button class="edit-rule-btn" data-index="${index}">수정</button>
                  <button class="delete-rule-btn" data-index="${index}">삭제</button>
              </div>
          `;
      overridesList.appendChild(item);
    });
  };

  // --- 이벤트 리스너 ---
  addNewRuleBtn.addEventListener("click", () => showEditorPage());
  cancelEditBtn.addEventListener("click", showMainPage);
  addHtmlInjectionBtn.addEventListener("click", () => openHtmlModal());
  cancelHtmlBtn.addEventListener("click", closeHtmlModal);

  // 실시간 HTML 미리보기
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

  // 전체 규칙 저장
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
      alert("URL 패턴을 입력해야 합니다.");
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

  // HTML 주입 규칙 하나를 임시 저장
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
      alert("주입 규칙 ID를 입력해야 합니다.");
      return;
    }
    if (!newInjection.htmlCode) {
      alert("HTML 코드를 입력해야 합니다.");
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

  // 규칙 목록 이벤트 위임
  overridesList.addEventListener("click", async (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;

    const { overrides = [] } = await chrome.storage.sync.get("overrides");

    if (e.target.classList.contains("edit-rule-btn")) {
      showEditorPage(overrides[index], index);
    } else if (e.target.classList.contains("delete-rule-btn")) {
      if (
        confirm(
          `'${overrides[index].urlPattern}' 규칙을 정말 삭제하시겠습니까?`
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

  // HTML 주입 목록 이벤트 위임
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

  // <script> 태그에서 순수 JS 코드만 추출하는 함수
  function extractJsFromHtml(rawInput) {
    const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;
    const match = rawInput.match(scriptTagRegex);
    return match ? match[1].trim() : rawInput;
  }

  // 초기화
  showMainPage();
});
