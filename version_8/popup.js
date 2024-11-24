document.addEventListener('DOMContentLoaded', () => {
    // "재료 변경하기" 버튼 가져오기
    const changeBtn = document.getElementById('change-btn');

    // 버튼 클릭 시 팝업 열기
    changeBtn.addEventListener('click', () => {
        const popup = window.open(
            'popup.html', // 팝업으로 표시할 HTML 파일 경로
            '재료 변경', // 팝업 창 제목
            'width=620,height=450,resizable=no' // 창 크기 및 옵션
        );

        if (!popup) {
            alert('팝업 차단을 해제해주세요.');
        }
    });
});
