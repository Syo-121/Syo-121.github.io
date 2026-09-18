// コードブロックに言語名とコピーボタンを付ける（4-F）
document.querySelectorAll("div.highlight").forEach((block) => {
  const code = block.querySelector("code");
  if (!code) return;

  const bar = document.createElement("div");
  bar.className = "code-bar";

  const lang = code.dataset.lang;
  if (lang) {
    const label = document.createElement("span");
    label.className = "code-lang";
    label.textContent = lang;
    bar.append(label);
  }

  if (navigator.clipboard) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-button";
    button.textContent = "コピー";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        button.textContent = "コピーしました";
      } catch {
        button.textContent = "コピーできませんでした";
      }
      setTimeout(() => {
        button.textContent = "コピー";
      }, 2000);
    });
    bar.append(button);
  }

  block.prepend(bar);
});
