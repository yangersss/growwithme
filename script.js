function toggleEnvironment(screenId) {
    const content = document.querySelector('.content');

    if (screenId === 'task-screen') {
        content.style.transform = 'translateX(0%)'; // Display the Tasks section
    } else if (screenId === 'game-screen') {
        content.style.transform = 'translateX(-100%)'; // Slide to the Game section
    }
}
