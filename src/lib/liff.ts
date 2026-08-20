import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID || '';

export const liffService = {
  async init(): Promise<boolean> {
    if (!LIFF_ID) return false;
    try {
      await liff.init({ liffId: LIFF_ID });
      return true;
    } catch (error) {
      console.error('LIFF init failed', error);
      return false;
    }
  },
  isInLiff(): boolean {
    return liff.isInClient();
  },
  async getLineProfile(): Promise<{ userId: string; displayName: string; pictureUrl?: string }> {
    return await liff.getProfile();
  },
  closeWindow(): void {
    liff.closeWindow();
  },
  async shareMessage(messages: object[]): Promise<void> {
    await liff.shareTargetPicker(messages as any);
  },
  isLoggedIn(): boolean {
    return liff.isLoggedIn();
  },
  login(): void {
    liff.login();
  },
};
