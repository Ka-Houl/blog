var reverseList = function(head) {
    // 方法2：递归解决
    if (!head || !head.next) {
      return head
    }
    let pre = reverseList(head.next)
    head.next.next = head
    head.next = null
    return pre
  };



  var reverseList2 = function(head) {
    let cur = head
    let pre = null
    while (cur) {
        let next = cur.next
        cur.next = pre
        pre = cur
        cur = next
    }
    return pre
  }

  var reverseList3 = function(head) {

    if (!head || !head.next) {
        return head
    }

    let cur = head
    let next = reverseList(cur.next)
    cur.next.next = cur
    cur.next = null
    return next
  }
