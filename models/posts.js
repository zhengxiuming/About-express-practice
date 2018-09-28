const Post = require('../lib/mongo').Post
const marked = require('marked')
const CommentModel = require('./comment')

Post.plugin('contentToHtml', {
  afterFind: function (posts) {
    return posts.map(function (post) {
      post.content = marked(post.content)
      return post
    })
  },
  afterFindOne: function (post) {
    if(post){
      post.content = marked(post.content)
    }
    return post
  }
})
Post.plugin('addCommentsCount', {
  afterFind: function (posts) {
    return Promise.all(posts.map(function (post) {
      return CommentModel.getCommentsCount(post._id).then(function (commentsCount) {
        post.commentsCount = commentsCount
        return post
      })
    }))
  },
  afterFindOne: function (post) {
    if (post) {
      return CommentModel.getCommentsCount(post._id).then(function (count) {
        post.commentsCount = count
        return post
      })
    }
    return post
  }
})

module.exports = {
  // 创建一篇文章
  create: function (post) {
    return Post.create(post).exec()
  },
  // 通过文章ID 获取一篇文章
  getPostById: function (postId) {
    return Post
    .findOne({_id: postId})
    .populate({path: 'author', model: 'User'})
    .addCreatedAt()
    .addCommentsCount()
    .contentToHtml()
    .exec()
  },
  // 按照创建时间降序获取所有用户文章或者某个特定用户的文章页
  getPosts: function (author) {
    const query = {}
    if(author){
      query.author = author
    }
    return Post
    .find(query)
    .populate({path: 'author', model: 'User'})
    .sort({_id: -1})
    .addCreatedAt()
    .addCommentsCount()
    .contentToHtml()
    .exec()
  },
  // 通过文章ID给PV加1
  incPv: function (postId) {
    return Post
      .update({ _id: postId }, { $inc: { pv: 1 } })
      .exec()
  },
  // 通过文章ID 获取一篇原生文章（编辑文章）
  getRawPostById: function (postId) {
    return Post.findOne({ _id: postId })
      .populate({path: 'author', model:'User'})
      .exec()
  },
  // 通过文章 id 更新一篇文章
  updatePostById: function (postId, data) {
    return Post.update({_id:postId},{$set:data}).exec()
  },
  // 通过文章id 删除一篇文章
  delPostById: function (postId,author) {
    return Post.deleteOne({ author: author, _id: postId })
      .exec()
      .then(function(res){
        // 文章删除后，再删除该文章下的所有留言
        if(res.result.ok && res.result.n > 0){
          return CommentModel.delCommentsByPostId(postId)
        }
      })
  }
}
