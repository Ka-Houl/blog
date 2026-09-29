/**
 * @param {number[][]} grid
 * @return {number}
 */
var minPathSum = function(grid) {
    const dp = new Array(grid.length).fill(1).map(item => new Array(grid[0].length).fill(0))

    for (let i = 0; i<grid.length; i++) {
        for (let j =0; j<grid[0].length; j++) {
            let num1 = i===0 ? Number.MAX_SAFE_INTEGER:  dp[i-1][j] 
            let num2 = j===0 ? Number.MAX_SAFE_INTEGER: dp[i][j-1]
            if (j === 0 && i===0) {
                dp[0][0] = grid[0][0]
            } else {
                dp[i][j] = Math.min(num1,num2) + grid[i][j]
            }

        }
    }

    return dp[grid.length-1][grid[0].length-1]
};

let grid = [[1,1,1]]

console.log(minPathSum(grid))