// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("코드 재정의 관리자 확장 프로그램이 설치/업데이트되었습니다.");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.startsWith("http")
  ) {
    const { overrides } = await chrome.storage.sync.get("overrides");
    if (!overrides || overrides.length === 0) return;

    for (const override of overrides) {
      try {
        const urlRegex = new RegExp(override.urlPattern);
        if (urlRegex.test(tab.url)) {
          console.log(
            `[Injector] MATCH FOUND for pattern: ${override.urlPattern}. Injecting code...`
          );
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: injectCodeAndHtml,
            args: [override],
          });
        }
      } catch (e) {
        console.error(
          `[Injector] Invalid regex pattern in rule: ${override.urlPattern}`,
          e
        );
      }
    }
  }
});

function injectCodeAndHtml(override) {
  const executeInjection = () => {
    // 1. 여러 개의 HTML 코드 주입 (있을 경우)
    if (override.htmlInjections && override.htmlInjections.length > 0) {
      override.htmlInjections.forEach((injection, index) => {
        if (!injection.htmlCode || !injection.injectionType) return;

        console.log(
          `[Injector] Attempting HTML injection #${index + 1}. Type: ${
            injection.injectionType
          }`
        );
        try {
          const tempContainer = document.createElement("div");
          tempContainer.innerHTML = injection.htmlCode;
          const nodesToInject = Array.from(tempContainer.childNodes);
          const targetElement = injection.querySelector
            ? document.querySelector(injection.querySelector)
            : document.body;

          if (!targetElement) {
            console.error(
              `[Injector] HTML injection #${
                index + 1
              } failed: Target selector '${injection.querySelector}' not found.`
            );
            return;
          }

          switch (injection.injectionType) {
            case "innerHTML":
              targetElement.innerHTML = injection.htmlCode;
              break;
            case "prepend":
              targetElement.prepend(...nodesToInject);
              break;
            case "append":
              targetElement.append(...nodesToInject);
              break;
          }
          console.log(
            `[Injector] HTML injection #${index + 1} successful on target:`,
            targetElement
          );
        } catch (e) {
          console.error(`[Injector] HTML injection #${index + 1} failed:`, e);
        }
      });
    }

    // 2. JavaScript 코드 주입 (HTML 주입 후에 실행)
    if (override.jsCode) {
      try {
        const script = document.createElement("script");
        script.textContent = override.jsCode;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
        console.log("[Injector] JS injection successful.");
      } catch (e) {
        console.error("[Injector] JS injection failed:", e);
      }
    }
  };

  if (document.readyState === "complete") {
    executeInjection();
  } else {
    window.addEventListener("load", executeInjection, { once: true });
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
