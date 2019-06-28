function mapErrorCode(code) {
    let response = {
        message: 'Unknown error',
        description: 'Code not in JSON RPC spec'
    }
    if (code >= -32000 && code <= 32099) {
        response.message = "Server error"
        response.description = "Reserved for implementation-defined server-errors."
    } else {
        switch (code) {
            case -32700: {
                response.message = "Parse Error"
                response.description = "Invalid JSON was received by the server.\nAn error occurred on the server while parsing the JSON text."
                break;
            }
            case -32600: {
                response.message = "Invalid Request"
                response.description = "The JSON sent is not a valid Request object."
                break;
            }
            case -32601: {
                response.message = "Method not found"
                response.description = "The method does not exist / is not available."
                break;
            }
            case -32602: {
                response.message = "Invalid params"
                response.description = "Invalid method parameter(s)."
                break;
            }
            case -32603: {
                response.message = "Internal error"
                response.description = "Internal JSON-RPC error."
                break;
            }
        }
    }

    return response;
}
module.exports = mapErrorCode;