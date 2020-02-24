import { getImageOptimizationParams } from "./utils";
import Redis from "./redis";
import { ImageOptimizer } from "./imgOptimizer";



export class ImageOptimizationHandler {
    constructor() { }

    /**
     * @returns ImageOptimizationHandler
     */
    static get instance() {
        return global._img_downloader_1 ? global._img_downloader_1 : (() => {
            global._img_downloader_1 = new ImageOptimizationHandler();
            return global._img_downloader_1;
        })();
    }

    /**
     * 
     * @param {*} req ExpressJS Request
     * @description Gets an image file (buffer + additional details parsed from the server).
     * @returns {
    * **   optimized: Buffer; The optimized image buffer.
    * 
    * **   imgType: Buffer; The image type (ex: png, jpg);
    * 
    * **   q1: number; The quality qualifier #1;
    * 
    * **   q2: number; The quality qualifier #2;
    * }
    */
    async getImage(req) {
        const queryText = req.url.substr(req.url.indexOf("?") + 1, req.url.length - 1);

        const { q1, q2, imgType, rw, rh } = getImageOptimizationParams(req);

        //Check on redis cache
        //console.log("Checking on redis cache: \n\n", { queryText });
        let resultObject = {
            optimized: Buffer.alloc(30), imgType, q1, q2
        };

        try {
            //console.log("About to check...");
            if (Redis.client) {
                let _redisBuffer = await Redis.getValue(queryText);    //Load redis-optimized object
                if (_redisBuffer) {
                    resultObject.optimized = _redisBuffer;
                } else {
                    resultObject = null;
                }
            }
            //console.log("Checked...");
            //console.log({ resultObject });
        } catch (e) {
            //console.log("Error getting improved image from redis - #1...\n\n", { e });
            resultObject = null;
        }

        if (resultObject) {             //If optimized object was found on redis
            console.log("Returning redis-saved image...");
            return resultObject;        //Return redis-optimized object
        }

        

        if (!resultObject) {            //If image was not found on redis db.
            console.log("No reddit-stored optimized image...");
            try {
                //console.log("Generating improved image...");
                let imgOpt = new ImageOptimizer();
                //console.log({'ImageOptimizer.instance':ImageOptimizer.instance});
                //console.log({'imgOpt': imgOpt});
                resultObject = await ImageOptimizer.instance.generateImprovedImage(req);   //Generate improved image.
                //console.log("Generated improved image...");
            } catch (e) {
                console.log({e});
                //console.log("Error generating improved image #1...\n\n", { e });
                if (e.fetchCode && e.fetchCode == 404) {
                    return null;
                }
            }
        }

        if (resultObject) {   //If image was generated
            //Save into redis.
            //console.log("Saving into " + queryText + ": \n\n", { resultObject });
            Redis.setValue(queryText, resultObject.optimized);
            //Return generated object.
            return resultObject;
        } else {
            //If it wasn't generated
            //throw new Error("Image wasn't generated...");
            console.log("Image wasn't optimized...");
            return resultObject ? resultObject.unoptimized : null;
        }
    }
}