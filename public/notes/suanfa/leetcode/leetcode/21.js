var mergeTwoLists = function(list1, list2) {
    let resList = new ListNode()
    let cur = resList
    while(list1 && list2) {
        if (list1.val < list2.val) {
            cur.next = list1
            list1 = list1.next
        } else {
            cur.next = list2.next
            list2 = list2.next
        }
        cur = cur.next
    }
    cur.next = list1 || list2
    return resList.next
};