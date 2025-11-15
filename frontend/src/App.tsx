import {BrowserRouter} from "react-router";
import AppRouter from "./components/AppRouter.tsx";
import {AuthProvider} from "./contexts/AuthContext.tsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRouter/>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
