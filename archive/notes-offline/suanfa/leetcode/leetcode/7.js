/**
 * @param {number} x
 * @return {number}
 */
var reverse = function(x) {
    let overflow = function (x) {
        return (x >= Math.pow(2, 31) - 1 || x <= -Math.pow(2, 31)) ? 0 : x
    }

    let stack = []

    while(x) {
        stack.push(x%10)
        x = parseInt(x / 10)
    }
    console.log(stack)

    for (let i of stack) {
        
    }
};

reverse(12345)