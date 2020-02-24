import { getImageAsBuffer } from "../../helper.js/image";
import { Redis } from "../../libs/redis";
const sizeOf = require('buffer-image-size');
const imagemin = require('imagemin');
const Jimp = require('jimp');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const fs = require("fs");
const path = require("path");

const image_404 = fs.readFileSync(path.resolve("public/icon-256x256.png"));


const _redis = new Redis();

if (!_redis.client) {
    _redis.initialize()
        .then(() => {
            console.log("Initialized redis...");
        }).catch((err) => {
            console.log("Error initializing redis...");
            console.log({ err });
        });
}


const _defImage = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";

const _getParams = function (req) {
    let { url, q1, q2, rw, rh } = req.query;
    url = url ? url.replace(/"/g, '') : _defImage;
    const imgType = url.substr(url.lastIndexOf(".") + 1, url.length - 1).toLowerCase() + "";
    q1 = q1 && !isNaN(parseFloat(q1)) && parseFloat(q1) > 0 ? parseFloat(q1) : 0.3;
    q2 = q2 && !isNaN(parseFloat(q2)) && parseFloat(q2) > 0 ? parseFloat(q2) : 0.5;
    if (q2 > q1) {
        let temp = q1;
        q1 = q2;
        q2 = temp;
    }
    rw = rw && !isNaN(parseFloat(rw)) ? parseFloat(rw) : null;
    rh = rh && !isNaN(parseFloat(rh)) ? parseFloat(rh) : null;
    return { url, q1, q2, imgType, rw, rh };
}

const optPlugins = {
    'png': [imageminPngquant({ strip: true, quality: [0.3, 0.5] })],
    'jpg': [imageminJpegtran()],
    'webp': [imageminWebp({ quality: 40 })]
}

const mimeBuffers = {
    'png': Jimp.MIME_PNG,
    'jpg': Jimp.MIME_PNG
}

/**
 * @description Resize an image and returns resized buffer
 * @param {*} imgBuffer The image buffer
 * @param {*} rw New resize width
 * @param {*} rh New resize height
 */
async function resizeImage(imgBuffer, rw, rh, imgType){
    let jimpImage = await Jimp.read(imgBuffer);
    if (rw && rh) {
        await new Promise((accept)=>{
            jimpImage.resize(rw, rh, function(err){
                if(err){
                    console.log({err});
                }
                accept();
            });
        });
    } else if (rw) {
        await new Promise((accept)=>{
            jimpImage.resize(rw, Jimp.AUTO, function(err){
                if(err){
                    console.log({err});
                }
                accept();
            });
        });
    } else if (rh) {
        await new Promise((accept)=>{
            jimpImage.resize(Jimp.AUTO, rh, function(err){
                if(err){
                    console.log({err});
                }
                accept();
            });
        });
    }
    let resizedImgBuffer = await new Promise((accept)=>{
        jimpImage.getBuffer(mimeBuffers[imgType] || Jimp.AUTO, (err, buffer)=>{
            accept(buffer);
        });
    });
    return resizedImgBuffer;
}

/**
 * @description This downloads and generates an improved image version the given a request to the
 * image
 * @returns The generated image server, in order to be stored to redis.
 * @returns Improved image buffer.
 */
async function generateImprovedImage(req) {
    const { url, q1, q2, imgType, rw, rh } = _getParams(req);
    let plugins = optPlugins[imgType];
    if (plugins) {
        try {
            let imgBuffer = await getImageAsBuffer(url);
            if(!imgBuffer || imgBuffer.length < 1){
                throw {fetchCode: 404};
            }
            if (rw || rh) {
                imgBuffer = await resizeImage(imgBuffer, rw, rh, imgType);
            }
            let optimized = await imagemin.buffer(imgBuffer, {
                plugins
            });
            return {unoptimized: imgBuffer, optimized, imgType, q1, q2 };
        } catch (e) {
            throw e;
        }
    } else {
        throw new Error(`Invalid image format: ${imgType}`);
    }
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
async function getImage(req) {
    const queryText = req.url.substr(req.url.indexOf("?") + 1, req.url.length - 1);

    const { q1, q2, imgType, rw, rh } = _getParams(req);

    //Check on redis cache
    //console.log("Checking on redis cache: \n\n", { queryText });
    let resultObject = {
        optimized: Buffer.alloc(30), imgType, q1, q2
    };

    try {
        //console.log("About to check...");
        if (_redis.client) {
            let _redisBuffer = await _redis.getValue(queryText);    //Load redis-optimized object
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
            resultObject = await generateImprovedImage(req);   //Generate improved image.
            //console.log("Generated improved image...");
        } catch (e) {
            //console.log("Error generating improved image #1...\n\n", { e });
            if(e.fetchCode && e.fetchCode == 404){
                return null;
            }
        }
    }

    if (resultObject) {   //If image was generated
        //Save into redis.
        //console.log("Saving into " + queryText + ": \n\n", { resultObject });
        _redis.setValue(queryText, resultObject.optimized);
        //Return generated object.
        return resultObject;
    } else {
        //If it wasn't generated
        //throw new Error("Image wasn't generated...");
        console.log("Image wasn't optimized...");
        return resultObject.unoptimized;
    }
}

export default (req, res) => {
    //console.log({url});
    getImage(req)
        .then((data) => {
            //console.log("Data to serve: ", { data });
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