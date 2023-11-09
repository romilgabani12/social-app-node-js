import express from 'express';

import {

    createStorie,
    getMyStories,
    getUserStories
} from "../controllers/storie.js";

import { isAuthenticated } from '../middlewares/auth.js';

const router = express();

router.route("/storie/upload").post(isAuthenticated, createStorie);

router.route("/my/storie").get(isAuthenticated, getMyStories);

router.route("/userStories/:id").get(isAuthenticated, getUserStories);


export default router;