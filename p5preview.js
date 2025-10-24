window.onload = () => {
  const iframe = document.getElementById('p5contents');
  iframe.srcdoc = localStorage.getItem('p5previewSrcdoc') || '';
};