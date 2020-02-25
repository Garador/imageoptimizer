## Description
This system is basically an image optimizer API for Next.js, which adds a API endpoint which allows to reduce the size of .png, .jpg and .webp images by embedding them into the request URL and specifying the quality.
The system uses a redis-based cache system in order to not re-work / re-do the optimization process for each image given it's parameters.

There is currently no redis cache-cleaning functionality, and it's quite basic, but it's a good proof-of-concept and starting point for a Next.js image optimization API for your server.

## API Usage

### The redis server
You need to have a Redis server running and configured in order for the Next.js server to connect. For ease of use, you could use a redis docker image.

### The Image Query
The basic usage is on index.

The URL to be used is like this:
`/api/imgmin?url=https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png&q1=0.3&q2=0.2&rw=200&rh=60`
Where:

**q1** The quality 'from' parameter, which specifies a starting quality value for the image optimization process ('from' quality). On .pngs, and absolute quality on .webp's. On .pngs, goes from 0.1 to 1, and on .webp's it goes from 1 to 100.

**q2** The quality 'to' parameter, which specifies an ending quality value for the image optimization process ('to' quality). Only applyable for .pngs. It goes from 0.1 to 1.

**rw** The number of final pixels width on which we'll resize our image. If none provided, it automatically resizes given it's ratio.

**rh** The number of final pixesl height on which we'll resize our image. If none provided, it automatically resizes given it's ratio.