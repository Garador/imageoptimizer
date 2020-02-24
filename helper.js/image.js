import * as request from 'request';

var options = {
    url: "",
    method: "get",
    encoding: null
};

export async function getImageAsBuffer(url = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg/1920px-Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg"){
    options.url = url;
    const data = await new Promise((accept)=>{
        request(options, function (error, response, body) {
            
            if (error || response.statusCode !== 200) {
                accept(null);
            } else {
                accept(body);
            }
        });
    });
    return data;
}
