function trapFocus(element) {
  const focusableEls = element.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  if(focusableEls.length === 0) return null;

  const firstFocusableEl = focusableEls[0];
  const lastFocusableEl = focusableEls[focusableEls.length - 1];

  function handleKeyDown(e) {
    const isTabPressed = (e.key === 'Tab' || e.keyCode === 9);

    if (!isTabPressed) {
      return;
    }

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusableEl.focus();

  // Return a cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}
