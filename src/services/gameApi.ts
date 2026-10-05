export interface QuestionOption {
  text: string;
  imageUrl: string | null;
  audioUrl?: string | null;
}

export interface ApiQuestion {
  id: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  points: number;
  timeLimit: number;
  order: number;
  hint?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
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

const BASE_URL = 'https://learning-platform-f6cy.onrender.com/api/v1';
const GAME_ID = 11;

let latestToken: string | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
    try {
        let storedRole = null;
        try {
            storedRole = localStorage.getItem("app_role");
        } catch (e) {
            console.warn("Could not access localStorage", e);
        }
        const refreshEndpoint = storedRole === "STUDENT" ? "/student/refresh" : "/auth/refresh";

        const refreshRes = await fetch(`${BASE_URL}${refreshEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: "{}"
        });

        if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData?.data?.accessToken || refreshData?.data?.token || refreshData?.accessToken || refreshData?.token;
            if (newToken) {
                console.log("Token refreshed successfully.");
                latestToken = newToken;

                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('token')) urlParams.set('token', newToken);
                if (urlParams.has('accesstoken')) urlParams.set('accesstoken', newToken);
                const newUrl = window.location.pathname + '?' + urlParams.toString();
                window.history.replaceState(null, '', newUrl);

                return newToken;
            }
        } else {
            console.error("Token refresh failed with status", refreshRes.status);
        }
    } catch (err) {
        console.error("Error during token refresh", err);
    }
    return null;
};

const apiFetch = async (url: string, options: RequestInit = {}, initialToken: string | null) => {
    if (!latestToken && initialToken) {
        latestToken = initialToken;
    }

    const currentToken = latestToken || initialToken;
    const fetchOptions = { ...options };
    if (currentToken) {
        fetchOptions.headers = { ...(fetchOptions.headers || {}), Authorization: `Bearer ${currentToken}` };
    }

    let res = await fetch(url, fetchOptions);

    if (res.status === 401) {
        console.warn("401 Unauthorized encountered. Attempting to refresh token...");
        const newToken = await refreshAccessToken();
        if (newToken) {
            fetchOptions.headers = { ...(fetchOptions.headers || {}), Authorization: `Bearer ${newToken}` };
            res = await fetch(url, fetchOptions);
        }
    }
    
    return res;
};

/**
 * 1. Fetch questions for the given lesson
 */
export async function fetchGameQuestions(
  lessonId: string | number,
  _token: string
): Promise<QuestionsApiResponse> {
  const token = await refreshAccessToken();
  if (!token) {
      console.warn("Could not retrieve initial access token in fetchGameQuestions");
  }

  const url = `${BASE_URL}/student/games/${GAME_ID}/questions?lessonId=${encodeURIComponent(lessonId)}`;
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  }, token);

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
  const url = `${BASE_URL}/student/games/${GAME_ID}/sessions?lessonId=${encodeURIComponent(lessonId)}`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }, token);

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
 */
export async function submitGameAnswers(
  sessionId: string,
  answers: AnswerSubmission[],
  token: string
): Promise<SubmitAnswersApiResponse> {
  if (!sessionId) {
    throw new Error('Session ID is missing');
  }

  const payload = answers.length > 0 ? answers : [
    {
      questionId: 1,
      selectedAnswer: 'none',
      timeTaken: 1,
    },
  ];

  const url = `${BASE_URL}/student/games/sessions/${encodeURIComponent(sessionId)}/submit-answers`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ answers: payload }),
  }, token);

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

  const url = `${BASE_URL}/student/games/sessions/${encodeURIComponent(sessionId)}/complete`;
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }, token);

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
