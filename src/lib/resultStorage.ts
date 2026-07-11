export const RESULT_STORAGE_KEY = 'tw-admission-latest-result';

export interface AdmissionResultPayload {
  results: any;
  formData: Record<string, any>;
  vocationalGroups: string[];
  createdAt: string;
}

export const saveAdmissionResult = (payload: AdmissionResultPayload) => {
  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(payload));
};

export const loadAdmissionResult = (): AdmissionResultPayload | null => {
  const raw = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdmissionResultPayload;
  } catch {
    window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
    return null;
  }
};
