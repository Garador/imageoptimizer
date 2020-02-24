import Head from 'next/head';

export default function Index(props){
    return (
        <div>
            <Head>
                <title>My App</title>
                <link rel="stylesheet" href="/skeleton.min.css"/>
            </Head>
            <div>
                <h1>Hello World</h1>
                <br/>
                <b>Original Image</b>
                <br/>
                <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"/>
                <br/>
                <b>Resized Image</b>
                <br/>
                <img src="/api/imgmin?url=https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png&q1=0.3&q2=0.5"/>
            </div>
        </div>
    );
};
