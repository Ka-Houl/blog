var addStrings = function(num1, num2) {
    let tag = 0
    let len = Math.max(num1.length, num2.length)
    let str = ''
    for (let i = 0; i<len; i++) {
        let a = Number(num1[num1.length-1-i] || 0)
        let b = Number(num2[num2.length-1-i] || 0)
        console.log(a, b)
        str = (tag+a+b) % 10 + str
        tag = tag +a+ b > 9 ? 1: 0
    }
    return tag === 1 ? tag+str:str
};

console.log(addStrings('11', '9'))