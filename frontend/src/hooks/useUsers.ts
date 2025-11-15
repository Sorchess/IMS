import UsersService from "../api/services/UsersService.ts";
import {useState} from "react";

const useAuth = () => {
    const [error, setError] = useState('');

    const avatarUpload = async (file: File) => {
        try {
            const response = await UsersService.avatarUpload(file)
            if (response.status === 200) {
                return true;
            } else {
                setError(response.data.detail);
            }
        } catch(e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    return {
        error,
        setError,
        avatarUpload,
    };
};

export default useAuth;