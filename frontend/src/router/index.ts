import WelcomePage from "../pages/WelcomePage.tsx";
import AuthPage from "../pages/AuthPage.tsx";
import RecoverPage from "../pages/RecoverPage.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";

export const privateRoutes = [
    {path: "/", component: WelcomePage, index: false },
    {path: "/dashboard", component: DashboardPage, index: false },
]

export const publicRoutes = [
    {path: "/", component: WelcomePage, index: false },
    {path: "/recover", component: RecoverPage, index: false },
    {path: "/auth", component: AuthPage, index: false },
]