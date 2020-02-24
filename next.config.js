//sudo docker run -d -p 6379:6379 jimeh/redis-for-development --bind 0.0.0.0
module.exports = {
    cssModules: true,
    exportTrailingSlash: true,
    exportPathMap: function () {
        return {
            '/': { page: '/' }
        };
    }
};