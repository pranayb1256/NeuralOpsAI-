import { Response   } from "express";
import { SearchService } from "../../services/search.service";
import { catchAsync } from "../../utils/catchAsync";
import {AuthenticatedRequest} from "../middlewares/requireAuth";

export class SearchController{
    static query = catchAsync(async(req:AuthenticatedRequest,res:Response)=>{
        const {serviceId,queryText,limit} = req.body;

        if(!serviceId || !queryText){
            res.status(400).json({error:'Missing required fields: serviceId and queryText'});
            return;
        }

        const result = await SearchService.executeSearch(serviceId,queryText,limit);
       res.status(200).json({success:true,data:result});

    })
}