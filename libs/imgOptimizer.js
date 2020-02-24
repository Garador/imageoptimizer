import { getImageAsBuffer } from "./image";
import { getImageOptimizationParams } from "./utils";
const imagemin = require('imagemin');
const Jimp = require('jimp');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminWebp = require('imagemin-webp');
const fs = require("fs");
const path = require("path");

export class ImageOptimizer {
    image_404 = fs.readFileSync(path.resolve("public/not-found-icon-256x256.png"));

    optPlugins = {
        'png': [imageminPngquant({ strip: true, quality: [0.3, 0.5] })],
        'jpg': [imageminJpegtran()],
        'webp': [imageminWebp({ quality: 40 })]
    }

    getOptimizationPlugins(mimeType="png", q1, q2){
        if(mimeType === 'png'){ //png takes two arguments, from 0.1 to 1
            let _opt = [0.3, 0.5];
            if(q1 > 0 && q1 <= 1){
                _opt[0] = q1;
            }
            if(q2 > 0 && q2 <= 1 && q2 > _opt[1]){
                _opt[1] = q2;
            }
            return [imageminPngquant({ strip: true, quality: _opt })];
        }else if(mimeType === 'jpg'){   //
            return [imageminJpegtran()];
        }else if(mimeType === 'webp'){  //Webp images only accept from 1 to 100
            if(q1 > 0 && q1 < 101){
                return [imageminWebp({ quality: q1 })];
            }
        }
    }
    
    mimeBuffers = {
        'png': Jimp.MIME_PNG,
        'jpg': Jimp.MIME_PNG
    }


    static get instance(){
        return global._img_optimizer ? global._img_optimizer : (()=>{
            global._img_optimizer = new ImageOptimizer();
            return global._img_optimizer;
        })();
    }

    /**
     * @description Resize an image and returns resized buffer
     * @param {*} imgBuffer The image buffer
     * @param {*} rw New resize width
     * @param {*} rh New resize height
     */
    async resizeImage(imgBuffer, rw, rh, imgType){
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
    async generateImprovedImage(req) {
        console.log({
            params: getImageOptimizationParams(req)
        });
        const { url, q1, q2, imgType, rw, rh } = getImageOptimizationParams(req);
        let plugins = this.getOptimizationPlugins(imgType, q1, q2);
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
}