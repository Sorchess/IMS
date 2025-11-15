import httpClient from "../httpClient.ts";

interface UserCredentials {
    email: string;
    password: string;
}

interface UserData {
    email?: string;
    password?: string;
    avatar?: string;
    username?: string;
}

export default class UsersService {
    static async loginUser(userCredentials: UserCredentials) {
        return await httpClient.post('/users/sign-in', userCredentials);
    }

    static async logoutUser() {
        return await httpClient.post('/users/logout');
    }

    static async registerUser(userCredentials: UserCredentials) {
        return await httpClient.post('/users/sign-up', userCredentials);
    }

    static async editUser(userData: UserData) {
        return await httpClient.patch('/users/edit', userData);
    }

    static async avatarUpload(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        return await httpClient.patch('/users/change-avatar', formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }

    static async getProfile() {
        return await httpClient.get('/users/me');
    }

    static async getUser(id: number) {
        return await httpClient.get(`/users/${id}`);
    }

    static async forgotPassword(email: string) {
        return await httpClient.post(`/users/forgot-password/`, email);
    }

    static async verifyEmail() {
        return await httpClient.post(`/users/verify-email/`);
    }

    static async verifyCode(token: string) {
        return await httpClient.post(`/verification/`, token);
    }
}