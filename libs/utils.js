import * as fs from 'fs';
import * as path from 'path';

export const getImageOptimizationParams = function (req) {
    let { url, q1, q2, rw, rh } = req.query;
    url = url ? url.replace(/"/g, '') : _defImage;
    const imgType = url.substr(url.lastIndexOf(".") + 1, url.length - 1).toLowerCase() + "";
    q1 = q1 && !isNaN(parseFloat(q1)) && parseFloat(q1) > 0 ? parseFloat(q1) : 0.3;
    q2 = q2 && !isNaN(parseFloat(q2)) && parseFloat(q2) > 0 ? parseFloat(q2) : 0.5;
    if (q1 > q2) {
        let temp = q1;
        q1 = q2;
        q2 = temp;
    }
    rw = rw && !isNaN(parseFloat(rw)) && parseFloat(rw) > 0 ? parseFloat(rw) : null;
    rh = rh && !isNaN(parseFloat(rh)) && parseFloat(rh) > 0 ? parseFloat(rh) : null;
    return { url, q1, q2, imgType, rw, rh };
}

export const image_404 = fs.readFileSync(path.resolve("public/not-found-icon-256x256.png"));