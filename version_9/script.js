let isOpen = false;

// 냉장고 문 요소와 로그인 공간 선택
const doorLeft = document.getElementById('door-left');
const doorRight = document.getElementById('door-right');
const loginSpace = document.getElementById('login-space');
const loginForm = document.getElementById('login-form');
const signupButton = document.getElementById('signup-button');

// 문 클릭 이벤트 추가
doorLeft.addEventListener('click', toggleFridge);
doorRight.addEventListener('click', toggleFridge);

// 냉장고 문 열고 닫는 함수
function toggleFridge() {
    if (isOpen) {
        // 문 닫기
        doorLeft.style.transform = 'rotateY(0deg)';
        doorRight.style.transform = 'rotateY(0deg)';
        loginSpace.style.display = 'none'; // 로그인 공간 숨기기
        isOpen = false;
    } else {
        // 문 열기
        doorLeft.style.transform = 'rotateY(-150deg)';
        doorRight.style.transform = 'rotateY(150deg)';
        setTimeout(() => {
            loginSpace.style.display = 'block'; // 로그인 공간 표시
        }, 1000); // 문 열림 애니메이션 후 나타남
        isOpen = true;
    }
}

// 로그인 폼 제출 이벤트
loginForm.addEventListener('submit', function (event) {
    event.preventDefault(); // 기본 제출 동작 막기
    const userId = document.getElementById('user-id').value;
    const userPw = document.getElementById('user-pw').value;

    if (userId && userPw) {
        alert(`로그인 성공! ID: ${userId}, Password: ${userPw}`);
        window.location.href = 'main.html';
        // 실제 로그인 처리 로직 추가 가능
    } else {
        alert('ID와 Password를 입력해주세요.');
    }
});

// 회원가입 버튼 클릭 이벤트
signupButton.addEventListener('click', function () {
    alert("회원가입 페이지로 이동합니다.");
    // 회원가입 페이지로 이동하거나 다른 동작 추가 가능
});
