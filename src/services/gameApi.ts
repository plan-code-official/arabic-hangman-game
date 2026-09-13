export interface QuestionOption {
  text: string;
  imageUrl: string | null;
}

export interface ApiQuestion {
  id: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
  order: number;
}

export interface QuestionsApiResponse {
  success: boolean;
  data: {
    lessonId: number | string;
    lessonName: string;
    questions: ApiQuestion[];
  };
  message?: string;
}

export interface StartSessionApiResponse {
  success: boolean;
  data: {
    id: string; // sessionId
  };
  message?: string;
}

export interface AnswerSubmission {
  questionId: number;
  selectedAnswer: string;
  timeTaken: number;
}

export interface SubmitAnswersApiResponse {
  success: boolean;
  message: string;
}

export interface SessionCompletionData {
  score: number;
  percentage: number;
  stars: number;
  coins: number;
  experience: number;
  session: {
    id: string;
    status: string;
  };
  reward: any;
  isNewReward: boolean;
}

export interface CompleteSessionApiResponse {
  success: boolean;
  data: SessionCompletionData;
  message?: string;
}

const BASE_URL = 'https://learning-platform-1euu.onrender.com/api/v1/student/games';
const GAME_ID = 11;

/**
 * 1. Fetch questions for the given lesson
 */
export async function fetchGameQuestions(
  lessonId: string | number,
  token: string
): Promise<QuestionsApiResponse> {
  const url = `${BASE_URL}/${GAME_ID}/questions?lessonId=${encodeURIComponent(lessonId)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = `HTTP error ${response.status}`;
    try {
      const json = JSON.parse(errorBody);
      if (json.message) parsedMessage = json.message;
    } catch {
      // Use raw text if not json
    }
    throw new Error(parsedMessage);
  }

  return response.json();
}

/**
 * 2. Start a new game session
 */
export async function startGameSession(
  lessonId: string | number,
  token: string
): Promise<StartSessionApiResponse> {
  const url = `${BASE_URL}/${GAME_ID}/sessions?lessonId=${encodeURIComponent(lessonId)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = `Failed to start game session (HTTP ${response.status})`;
    try {
      const json = JSON.parse(errorBody);
      if (json.message) parsedMessage = json.message;
    } catch {
      // fallback
    }
    throw new Error(parsedMessage);
  }

  return response.json();
}

/**
 * 3. Submit Answers
 * Note: The backend requires answers array to contain at least 1 answer.
 */
export async function submitGameAnswers(
  sessionId: string,
  answers: AnswerSubmission[],
  token: string
): Promise<SubmitAnswersApiResponse> {
  if (!sessionId) {
    throw new Error('Session ID is missing');
  }

  // Ensure answers array is never empty to prevent 400 Validation Failed
  const payload = answers.length > 0 ? answers : [
    {
      questionId: 1,
      selectedAnswer: 'none',
      timeTaken: 1,
    },
  ];

  const url = `${BASE_URL}/sessions/${encodeURIComponent(sessionId)}/submit-answers`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ answers: payload }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = `Failed to submit answers (HTTP ${response.status})`;
    try {
      const json = JSON.parse(errorBody);
      if (json.message) parsedMessage = json.message;
    } catch {
      // fallback
    }
    throw new Error(parsedMessage);
  }

  return response.json();
}

/**
 * 4. Complete Session
 */
export async function completeGameSession(
  sessionId: string,
  token: string
): Promise<CompleteSessionApiResponse> {
  if (!sessionId) {
    throw new Error('Session ID is missing');
  }

  const url = `${BASE_URL}/sessions/${encodeURIComponent(sessionId)}/complete`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = `Failed to complete game session (HTTP ${response.status})`;
    try {
      const json = JSON.parse(errorBody);
      if (json.message) parsedMessage = json.message;
    } catch {
      // fallback
    }
    throw new Error(parsedMessage);
  }

  return response.json();
}
