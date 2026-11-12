/**
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
var combinationSum = function(candidates, target) {
    let res = []

    function dfs (hadNums, target, allNums) {
        if (0 === target) {
            res.push(hadNums)
            return
        }

        for(let i=0; i< allNums.length; i++) {
            let num = allNums[i]
            if (num <= target) {
                dfs([...hadNums, num], target - num, allNums.slice(i))
            }
        }
    }

    dfs([], target, candidates)

    return res
};

console.log(combinationSum([2,3,5,6,7], 8))

