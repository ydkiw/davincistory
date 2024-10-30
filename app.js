async function getCompletion(text) {

  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      prompt: text,
      max_tokens: 100
    })
  });

  const data = await response.json();
  return data.choices[0].text;
}

async function generate() {
  const prompt = document.getElementById("prompt").value;
  const output = document.getElementById("output");

  if (!prompt) return;

  const completion = await getCompletion(prompt);
  output.innerText = completion;
}

const apiKeyScreen = document.getElementById('api-key-screen');
const apiKeyInput = document.getElementById('api-key-input');
const apiKeySubmit = document.getElementById('api-key-submit');
const startScreen = document.getElementById('start-screen');
const gameUI = document.getElementById('game-ui');
const dialogueText = document.getElementById('dialogue-text');
const optionsDiv = document.getElementById('keyword-options');
const endButton = document.getElementById('end-button');
const gameBackground = document.getElementById('game-background');
const introImage = document.getElementById('sulmyung');

let userApiKey = ''; // 사용자가 입력한 API 키를 저장할 변수
let storyText = "이제부터 당신의 이야기가 시작됩니다."; // 초기 스토리 시작
let initialStoryGenerated = false; // 초기 스토리 생성 여부를 추적
let objectionCount = 0;
const maxObjections = 5;
let passageCount = 0; 
const maxPassages = 3; 
let keywordSelections = 0; 

gameBackground.style.backgroundImage = "url('nightdavinci.png')"

// API 키를 입력받아 저장
apiKeySubmit.addEventListener('click', () => {
  userApiKey = apiKeyInput.value.trim();
  if (userApiKey) {
    apiKeyScreen.style.display = 'none';
    startScreen.style.display = 'none'; 
    introImage.style.display = 'block';

  } else {
    alert('API Key를 입력해주세요.');
  }
});

introImage.addEventListener('click', () => {
  introImage.style.display = 'none'; // 설명 이미지 숨기기
  gameUI.style.display = 'block'; // 게임 UI 표시

  generateInitialStory(); // 게임 시작 스토리 설정
  setRandomGif(); // 초기 gif 설정
});

// API 키 제출 함수
function submitApiKey() {
  userApiKey = apiKeyInput.value.trim();
  if (userApiKey) {
    // 시작 화면과 API 입력 창을 숨김
    apiKeyScreen.style.display = 'none';
    startScreen.style.display = 'none';
    logo.style.display = 'none'; // 로고도 숨김
    // 게임 UI를 보이게 설정
    gameUI.style.display = 'block';
  } else {
    alert('API Key를 입력해주세요.');
  }
}

// 버튼 클릭 시 API 키 제출
apiKeySubmit.addEventListener('click', submitApiKey);

// 엔터 키로 API 키 제출
apiKeyInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    submitApiKey();
  }
});

async function typeText(element, text, delay = 50) {
  element.innerHTML = ''; // innerHTML로 변경하여 HTML 형식으로 공백 처리
  for (let i = 0; i < text.length; i++) {
      // 공백일 경우 '&nbsp;'로 대체하여 추가
      const char = text[i] === ' ' ? '&nbsp;' : text[i];
      element.innerHTML += char;
      await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// GPT-4o 미니 API 호출
async function continueStory(prompt) {
try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey}` // 사용자가 입력한 API 키 사용
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "다빈치관에서 야작을 하고 있는 미대생의 환상적인 독특한 스토리를 생성해줘. 이야기의 흐름을 유지하면서도, 온전한 문장으로 끝내줘." }, { role: "user", content: prompt }],
            max_tokens: 200,
            n: 1,
            stop: "\n\n",
            temperature: 0.7
        })
    });

    const data = await response.json();
    const newText = data.choices[0].message.content;

    // 타이핑 효과로 텍스트 출력
    await typeText(dialogueText, newText);

    return newText;
} catch (error) {
    console.error("Story generation error: ", error);
    return "스토리를 불러오는데 문제가 발생했습니다.";
}
}

  // 키워드 무작위 생성 요청
  async function generateRandomKeywords() {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: "세 가지 단어를 무작위로 생성해줘." }],
            max_tokens: 50,
            n: 1,
            stop: null,
            temperature: 0.9
          })
        });
    
        const data = await response.json();
        const keywordText = data.choices[0].message.content;
        return keywordText.split(',').slice(0, 3); // 키워드를 3개로 제한하고 배열로 반환
      } catch (error) {
        console.error("Keyword generation error: ", error);
        return ["문제 발생", "재시도", "오류"]; // 오류 발생 시 기본 키워드 반환
      }
    }

// 키워드 선택지 표시
async function showKeywordOptions() {
  gifElement.style.display = 'none'; // 키워드 선택창이 열릴 때 gif 숨기기
  const keywords = await generateRandomKeywords(); // AI로부터 키워드 생성
  optionsDiv.innerHTML = ''; // 기존 키워드 제거
  keywords.forEach((keyword) => {
    const button = document.createElement('button');
    button.innerText = keyword.trim(); // 키워드 버튼 생성
    button.onclick = () => chooseKeyword(keyword.trim()); // 각 버튼이 하나의 키워드를 선택
    optionsDiv.appendChild(button); // 각 키워드마다 개별 버튼 생성
  });
  optionsDiv.style.display = 'flex'; // 키워드 선택지 버튼들을 flex로 표시
}

let progressionText;
let storySegmentCounter = 1;
const finalGifElement = document.getElementById("final-gif");

// 키워드 선택 후 이야기 전개
async function chooseKeyword(keyword) {
  optionsDiv.style.display = 'none';
  storyText += `\n\n선택된 키워드: ${keyword}`;
  dialogueText.innerText = `선택된 키워드: ${keyword}(으)로 이야기가 계속됩니다...`;

  // 이야기 진행 상태에 따라 전개 지시
  if (keywordSelections === 0) {
      progressionText = "이야기의 새로운 전개를 시작해줘.";
  } else if (keywordSelections === 1) {
      progressionText = "갈등의 절정을 향해 이야기를 이어줘.";
  } else if (keywordSelections === 2) {
      progressionText = "이야기의 결말로 이어지는 반전을 이어줘.";
  } else {
      progressionText = "마지막 결말을 완성된 문장으로 지어줘.";
  }

  const newStory = await continueStory(storyText + `\n${progressionText}`);
  storyText += "\n" + newStory;
  dialogueText.innerText = newStory;
  optionsDiv.style.display = 'none';
  gifElement.style.display = 'block'; // 키워드 선택 후 gif 다시 표시
  keywordSelections++;
  
  // 배경 이미지 업데이트
  if (keywordSelections === 1) {
      gameBackground.style.backgroundImage = "url('forest.png')";
  } else if (keywordSelections === 2) {
      gameBackground.style.backgroundImage = "url('dream.png')";
  } else if (keywordSelections === 3) {
      gameBackground.style.backgroundImage = "url('book.png')";
  }

  // 3번 키워드를 선택하면 결말로 이어지는 이야기 완성
  if (keywordSelections === 3) {
    gifElement.style.display = 'none'; // 기존 tech gif 숨기기
    finalGifElement.style.display = 'block'; // 마무리 gif 표시

    // 결말 완성과 마무리 버튼 표시
    for (let i = 0; i < 3; i++) {
        const additionalStory = await continueStory(storyText + "\n마지막 결말을 완성된 문장으로 지어줘.");
        storyText += "\n" + additionalStory;
        dialogueText.innerText = additionalStory;
    }
    endButton.style.display = 'block'; // 마무리 버튼 표시
    finalGifElement.style.display = 'none'; // 마무리 버튼이 나타날 때 마무리 gif 숨기기
}

passageCount = 0;
}

// gif 파일 배열
const gifs = ["tech1.gif", "tech2.gif", "tech3.gif"];
const gifElement = document.getElementById("game-gif"); // HTML에 추가된 gif 요소 참조

let isFollowing = false; // 이미지가 마우스를 따라다니는 상태를 나타냄

// 초기 gif 설정 함수
function setRandomGif() {
  const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
  gifElement.src = randomGif;
}

// 마우스 이동에 따라 이미지 위치 업데이트
function moveImage(e) {
  gifElement.style.left = `${e.clientX}px`;
  gifElement.style.top = `${e.clientY}px`;
}

// 클릭하여 이미지 따라다니기 시작 및 고정
gifElement.addEventListener("click", (e) => {
  if (!isFollowing) {
      // 첫 번째 클릭 시 마우스 따라다니기 시작
      isFollowing = true;
      gifElement.style.position = "fixed";
      gifElement.style.transform = "translate(-50%, -50%)"; // 중앙 정렬
      document.addEventListener("mousemove", moveImage); // 마우스 이동 시 이미지 위치 업데이트
  } else {
      // 두 번째 클릭 시 현재 위치에 고정
      isFollowing = false;
      document.removeEventListener("mousemove", moveImage); // 마우스 이동 이벤트 제거
  }
});

gifElement.style.position = "absolute";
gifElement.style.cursor = "grab";
gifElement.style.left = "50%";
gifElement.style.top = "50%";
gifElement.style.transform = "translate(-50%, -50%)"; // 화면 중앙에 위치

// 대사 넘기기 기능
document.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
      if (!initialStoryGenerated) {
          // 초기 스토리를 한 번만 설정
          generateInitialStory(); 
          startScreen.style.display = 'none';
          gameUI.style.display = 'block';
      } else if (passageCount < maxPassages) {
          setRandomGif(); // 엔터를 치자마자 GIF 변경
          const nextPassage = await continueStory(storyText + `\n${progressionText}`);
          dialogueText.innerText = nextPassage;
          storyText += "\n" + nextPassage;
          passageCount++;

          // 최대 횟수 도달 시, 키워드 선택 화면으로 전환
          if (passageCount === maxPassages) {
              showKeywordOptions(generateRandomKeywords());
          }
      }
  }
});

async function generateInitialStory() {
if (!initialStoryGenerated) {
  dialogueText.innerText = storyText;
  initialStoryGenerated = true;
}
}

// 마무리 버튼 클릭 시 스토리 요약 창 표시
endButton.addEventListener('click', () => {
  const summaryWindow = window.open("", "Story Summary", "width=600,height=400");
  summaryWindow.document.write("<h1>스토리 요약</h1><pre>" + storyText + "</pre>");
  summaryWindow.document.close();
});