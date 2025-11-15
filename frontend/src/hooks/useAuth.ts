import {useState} from "react";
import UsersService from "../api/services/UsersService.ts";

const useAuth = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState('');

    const validateForm = (): string | null => {
        if (!email || !password) {
            return 'Пожалуйста, заполните все поля';
        }

        if (!email.includes('@')) {
            return 'Введите корректный email адрес';
        }

        if (password.length < 6) {
            return 'Пароль должен содержать минимум 6 символов';
        }

        return null;
    };

    const registerUser = async () => {
        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        setLoading(true);
        try {
            const response = await UsersService.registerUser({email, password})
            if (response.status === 200) {
                setEmail('');
                setPassword('');
                return response.data;
            } else {
                setError(response.data.detail);
            }
        } catch(e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async () => {
        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        setLoading(true);
        try {
            const response = await UsersService.loginUser({ email, password });

            if (response.status === 200) {
                setEmail('');
                setPassword('');
                return response.data;
            } else {
                setError(response.data.detail);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
        setLoading(false);
        }

    };

    const logoutUser = async () => {
        setLoading(true);
        try {
            const response = await UsersService.logoutUser();
            if (response.status === 200) {
                return true;
            } else {
                setError(response.data.detail);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    const getUser = async () => {
        setLoading(true);
        try {
            const response = await UsersService.getProfile();
            if (response.status === 200) {
                return response.data;
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        setError,
        registerUser,
        loginUser,
        logoutUser,
        getUser,
    };
};

export default useAuth;