export function fitCardText(el: HTMLElement): void {
  el.style.whiteSpace = "nowrap";
  requestAnimationFrame(() => {
    if (el.scrollWidth <= el.offsetWidth) return;
    // Start from CSS-defined size, step down until it fits
    let sizePx = parseFloat(getComputedStyle(el).fontSize);
    const minPx = 10;
    while (el.scrollWidth > el.offsetWidth && sizePx > minPx) {
      sizePx -= 1;
      el.style.fontSize = sizePx + "px";
    }
  });
}
