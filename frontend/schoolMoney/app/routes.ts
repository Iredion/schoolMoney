import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
    route("/", "utils/anchor.tsx", [
        index("login/login.tsx"),
        route("register", "register/register.tsx"),
        route("home", "home/home.tsx"),
        route("klasa", "klasa/klasa.tsx"),
        route("zbiorki", "zbiorki/zbiorki.tsx"),
        route("skarbnikPanel", "skarbnikPanel/skarbnikPanel.tsx"),
        route("rodzicPanel", "rodzicPanel/rodzicPanel.tsx"),
        route("adminPanel", "adminPanel/adminPanel.tsx"),
        route("chat", "chat/chat.tsx"),
    ]),
] satisfies RouteConfig;