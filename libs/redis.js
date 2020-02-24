import * as redis from "redis";

export class Redis {
    
    static async initialize(){
        if(global.initializing_redis) return;
        global.initializing_redis = true;
        global.redis = redis.createClient(6379, process.env.REDIS_HOST || '0.0.0.0', {'return_buffers': true});
        await new Promise((accept)=>{
            global.redis.on('connect', accept);
        });
    }

    static get client(){
        return global.redis ? global.redis : null;
    }

    static async getValue(key = "string"){
        let value = await new Promise((accept)=>{
            this.client.get(key, (err, data)=>{
                accept(data);
            })
        });
        return value;
    }

    static async setValue(key = "string", value){
        await new Promise((accept)=>{
            this.client.set(key, Buffer.from(value), accept);
        });
        return value;
    }
}

export default Redis;