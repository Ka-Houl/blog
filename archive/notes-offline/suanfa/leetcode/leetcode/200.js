/**
 * @param {character[][]} grid
 * @return {number}
 */
var numIslands = function(grid) {
    let sum = 0
    for (let i = 0; i< grid.length; i++) {
        for (let j = 0; j<grid[0].length; j++) {
            if (grid[i][j] === '1') {
                sum++
                change1To0(i, j)
            }

        }
    }
    return sum

    function change1To0(i, j) {
        grid[i][j] = '0'
        if(grid[i][j+1] === '1') {
            change1To0(i, j+1)
        }
        if(grid[i][j-1] === '1') {
            change1To0(i, j+1)
        }
        if(grid[i+1] && grid[i+1][j] === '1') {
            change1To0(i, j+1)
        }
        if(grid[i-1] && grid[i-1][j] === '1') {
            change1To0(i, j+1)
        }
    }
};