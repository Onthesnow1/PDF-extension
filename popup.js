let count = 0;
document.addEventListener('DOMContentLoaded', function() {
  const counterText = document.getElementById('counter');
  const addButton = document.getElementById('add');
  
  addButton.addEventListener('click', function() {
    count++;
    counterText.textContent = count;
  });
}); 