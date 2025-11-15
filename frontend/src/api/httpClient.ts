import axios from 'axios';

const httpClient = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: (s) => s < 500,
});

httpClient.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
});


httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default httpClient;