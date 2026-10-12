import { Router } from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { OtpRoutes } from "../modules/otp/otp.routes";
import { SetupRoutes } from "../modules/setup/setup.routes";

export const router = Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes,
    },
    {
        path: "/otp",
        route: OtpRoutes,
    },
    {
        path: "/user",
        route: UserRoutes,
    },
    {
        path: "/setup",
        route: SetupRoutes,
    },
];

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

