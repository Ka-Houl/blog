/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    let stack = []
    for (let i of s) {
        if (i === '(' || i === '[' || i === '{') {
            stack.push(i)
        } else {
            let top = stack.pop()
            if (i === ')' && top !== '(' || i === ']' && top !== '[' || i === '}' && top !== '{') {
                return false
            }
           
        }
    }
    return stack.length === 0
};


console.log(isValid('([)]'))
