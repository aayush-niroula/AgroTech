import express, { Request, Response } from 'express'
import { getUserConversations ,createOrGetConversation, sendMessage, getMessages} from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const chatRoutes = express.Router();

chatRoutes.post('/conversation/:sellerId',authMiddleware, async(req:Request,res:Response)=>{
    createOrGetConversation(req,res)
});

// GET: Get all conversations for a user
chatRoutes.get('/conversation/:userId',authMiddleware, async(req:Request,res:Response)=>{
    getUserConversations(req,res)
});

// POST: Send a message
chatRoutes.post('/message/:conversationId',authMiddleware, async(req:Request,res:Response)=>{
    sendMessage(req,res)
})

// GET: Get all messages in a conversation
chatRoutes.get('/message/:conversationId',authMiddleware, async(req:Request,res:Response)=>{
    getMessages(req,res)});

export default chatRoutes;

