import {Navigate, Route, Routes, useNavigate} from 'react-router';
import { publicRoutes, privateRoutes } from "../router";
import {useContext, useEffect} from "react";
import {AuthContext} from "../contexts/AuthContext.tsx";

const AppRouter = () => {
    const { userData } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (userData) {
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/auth', { replace: true });
        }
    }, [userData]);

    return (
        userData
            ?
            <Routes>
                {privateRoutes.map(route =>
                    <Route
                        path={route.path}
                        element={route.component()}
                        key={route.path}
                    />
                )}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            :
            <Routes>
                {publicRoutes.map(route =>
                    <Route
                        index={route.index}
                        path={route.path}
                        element={route.component()}
                        key={route.path}
                    />
                )}
                <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>



    );
};

export default AppRouter;