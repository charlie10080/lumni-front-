function withLoading(buttonElement, asyncFunction) {
  const originalHtml = buttonElement.innerHTML;
  const originalWidth = buttonElement.offsetWidth;

  // Establecer estado de carga
  buttonElement.disabled = true;
  buttonElement.style.width = `${originalWidth}px`; // Mantener ancho
  buttonElement.innerHTML = `<svg class="animate-spin h-4 w-4 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

  // Simular latencia de red si estamos usando localStorage
  setTimeout(() => {
    try {
      asyncFunction();
    } catch (error) {
      console.error(error);
    } finally {
      // Restaurar estado
      buttonElement.innerHTML = originalHtml;
      buttonElement.disabled = false;
      buttonElement.style.width = '';
    }
  }, 600);
}
