import {createContext, type ReactNode, useEffect, useState} from "react";
import useAuth from "../hooks/useAuth.ts";
import Overlay from "../components/UI/overlay/Overlay.tsx";
import Loading from "../components/UI/loading/Loading.tsx";

type UserProps = {
    id: number;
    username: string;
    email: string;
    email_verified: boolean;
    registered_in: string;
    avatar_url: string;
}

interface AuthContextProps {
    setUserData: (userData: UserProps | null) => void;
    userData: UserProps | null;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextProps>({
    setUserData: () => {},
    userData: null,
})

export const AuthProvider = ({children}: AuthProviderProps) => {
    const [ userData, setUserData ] = useState<UserProps | null>(null);
    const { isLoading, getUser } = useAuth();

    useEffect(() => {
        (async () => {
            const data = await getUser();
            if (data) {
                setUserData(data.data);
            }
        })();
    }, []);

    return (
        <AuthContext.Provider value={{
            userData,
            setUserData
        }}>
            <Overlay show={isLoading} solid={true} >
                <Loading show={isLoading}/>
            </Overlay>
            {children}
        </AuthContext.Provider>
    )
}