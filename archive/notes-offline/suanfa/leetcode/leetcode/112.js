var hasPathSum = function(root, targetSum) {
    if (!root) {
        return false
    }

    let {val, left, right} = root
    if (val === targetSum && (!left && !right)) {
        return true
    }
    let tag1 = false
    let tag2 = false
    if (left) {
        tag1 = hasPathSum(left, targetSum-val)
    }
    if (right) {
        tag2 = hasPathSum(right, targetSum-val)
    }

    return tag1||tag2
};