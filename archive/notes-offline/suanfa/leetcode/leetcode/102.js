/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
function TreeNode(val, left, right) {
         this.val = (val===undefined ? 0 : val)
        this.left = (left===undefined ? null : left)
         this.right = (right===undefined ? null : right)
     }
     let n4 = new TreeNode(4, null, null)
     let n3 =new TreeNode(3, n4, null)
     let n2 = new TreeNode(2, n3, n4)
     let n1 =new  TreeNode(1, n2, null)




     console.log(n1)

/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
var levelOrder = function(root) {
    let resList = []
    
    let loop = (nodeList) => {
        let list = []
        let elementList = []
        nodeList.forEach(element => {
            if (element) {
                elementList.push(element.val)
                element.left && list.push(element.left)
                element.right && list.push(element.right)    
            }
                   
        });
        elementList.length && resList.push(elementList)
        list.length && loop(list)
    }

    loop([root])

    return resList
};

console.log(levelOrder(n1))