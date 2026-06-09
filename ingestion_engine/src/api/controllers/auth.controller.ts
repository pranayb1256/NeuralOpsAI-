import {Request,Response} from 'express'
import { AuthService } from '../../services/auth.service'
import { catchAsync } from '../../utils/catchAsync'

export class AuthController {
    static register=catchAsync(async(req:Request,res:Response)=>
    {
        const {email,password,name}=req.body

        const result = await AuthService.registerUser(email,password,name)
        res.status(201).json({
            success:true,
            data:result
        })
    })
    static login= catchAsync(async(req:Request,res:Response)=>
    {
        const {email,password}=req.body
        const result = await AuthService.loginUser(email,password)
        res.status(200).json({
            success:true,
            data:result
        })
    })
}