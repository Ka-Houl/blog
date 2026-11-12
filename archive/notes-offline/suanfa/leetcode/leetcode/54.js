/**
 * @param {number[][]} matrix
 * @return {number[]}
 */
var spiralOrder = function(matrix) {
    let allLen = matrix.length * matrix[0].length
    let i = 0
    let j = 0
    let res = [matrix[0][0]]
    let d = 'r'
    let inBox = (i, j) => i >= 0 && i< matrix.length && j >=0  && j <matrix[0].length  && matrix[i][j] !== 'x'
    while(allLen !== res.length) {
        if (d === 'r') {
            if (inBox(i,j+1)) {
                res.push(matrix[i][j+1])
                matrix[i][j+1] = 'x'
                j++
            } else {
                d = 'd'
            }
        }
    }
};