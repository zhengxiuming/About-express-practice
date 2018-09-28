const Comment = require('../lib/mongo').Comment
const marked = require('marked')

Comment.plugin('contentToHtml', {
  afterFind: function (comments) {
    return comments.map((comment)=>{
      comment.content = marked(comment.content)
      return comment
    })
  }
})

module.exports = {
  // 创建一个留言
  create: function (comment) {
    return Comment.create(comment).exec()
  },
  // 通过留言 id 获取一个留言
  getCommentById: function (commentId) {
    return Comment.findOne({_id: commentId}).exec()
  },
  // 通过留言 ID 删除一个留言
  delCommentById: function (commentId) {
    return Comment.deleteOne({_id:commentId}).exec()
  },
  // 通过文章 id 删除该文章下的所有留言
  delCommentsByPostId: function (postId) {
    return Comment.deleteMany({postId: postId})
  },
  // 通过文章id获取该文章下所有留言，按留言创建时间升序
  getComments: function (postId) {
    return Comment
      .find({postId: postId})
      .populate({path:'author',model:'User'})
      .sort({_id:1})
      .addCreatedAt()
      .contentToHtml()
      .exec()
  },
  // 通过文章id 获取该文章下留言数
  getCommentsCount: function (postId) {
    return Comment.count({postId:postId}).exec()
  }
}
