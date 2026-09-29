/**
 * @param {number} n
 * @return {string[]}
 */
var generateParenthesis = function(n) {

    let res = []

    function generate(leftLen, rightLen, beforeStr) {
        if (leftLen === 0 && rightLen === 0) {
            res.push(beforeStr)
        }
        if (leftLen) {
            generate(leftLen-1, rightLen, beforeStr + '(')
        }
        if (rightLen > leftLen && rightLen) {
            generate(leftLen, rightLen-1, beforeStr + ')')
        }
    }

     generate(n, n, '')
     return res
};

console.log(generateParenthesis(1))