module.exports = function guid(parts = 1) {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    let guid = "";
    for (let c = 0; c < parts; c++) {
        guid += s4() + "-";
    }

    guid = guid.substring(0, guid.length - 1);

    return guid;
}