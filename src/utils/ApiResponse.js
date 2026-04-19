class ApiResponse {
    constructor(statusCode , data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponse}
//Standard rules
//informational responses (Error :  100 - 199)
//Successful responses (Error 200 - 299)
//Redirection messages (Error : 300 - 399)
//Client error responses (Error : 400 - 499)
//Server error responses (Error : 500 - 599)