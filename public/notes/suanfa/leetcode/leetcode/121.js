/**
 * @param {number[]} prices
 * @return {number}
 */
var maxProfit = function(prices) {
    let min = prices[0]
    let profit = 0
    for(let num of prices) {
        min = Math.min(min, num)
        profit = Math.max(profit, num-min)
    }
    return profit
};

console.log(maxProfit([2, 100, 1,2,3,4]))