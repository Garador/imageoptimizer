import { Redis } from "../../libs/redis";
import {ImageOptimizationHandler} from '../../libs/imgHandler';
import { image_404 } from "../../libs/utils";


if (!Redis.client) {
    Redis.initialize()
    .then(() => {
        console.log("Initialized redis...");
    }).catch((err) => {
        console.log("Error initializing redis...");
        console.log({ err });
    });
}

export default (req, res) => {
    //console.log({url});
    ImageOptimizationHandler
    .instance
    .getImage(req)
    .then((data) => {
        //console.log("Data to serve: ", { data });
        console.log({data});
        if(!data){  //If no image was generated
            res.setHeader('Content-Type', `image/png`);
            res.status(200).send(image_404);
        }else{
            res.setHeader('Content-Type', `image/${data.imgType}`);
            res.status(200).send(data.optimized || data.unoptimized);
        }
    })
    .catch((err) => {
        console.log({ err });
        res.status(500).send("Something wrong happened here...");
    });
}