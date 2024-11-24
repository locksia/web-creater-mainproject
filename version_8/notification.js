function toggleNotification() {
    const popup = document.getElementById('notificationPopup');
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'flex'; // 알림 팝업 표시
    } else {
        popup.style.display = 'none'; // 알림 팝업 숨김
    }
}
