import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator, 
// and the local IP for physical devices/LAN.
// const BASE_URL = 'http://10.208.4.179:8001'; 
const BASE_URL = 'http://10.208.4.179:8001';

export interface GenerateResponse {
    status: string;
    message: string;
}

export interface CodeResponse {
    code: string;
}

export const apiClient = {
    /**
     * Sends a prompt to the backend to generate firmware and trigger OTA.
     * @param prompt The user's prompt (e.g., "Blink LED on pin 2")
     * @param espIp The IP address of the ESP32 (for OTA trigger)
     */
    async generateFirmware(prompt: string, espIp: string): Promise<GenerateResponse> {
        try {
            const response = await fetch(`${BASE_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    esp_ip: espIp,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend Error: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Generate Error:', error);
            throw error;
        }
    },

    /**
     * Retrieves the currently generated firmware code.
     */
    async getCode(): Promise<string> {
        try {
            const response = await fetch(`${BASE_URL}/code`);

            if (!response.ok) {
                throw new Error(`Failed to fetch code: ${response.status}`);
            }

            const data: CodeResponse = await response.json();
            return data.code;
        } catch (error) {
            console.error('API GetCode Error:', error);
            return '// Failed to load code from backend.';
        }
    }
};
