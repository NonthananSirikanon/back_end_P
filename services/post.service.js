const { Post, User } = require('../models')
const config = require('../configs/app')

const methods = {
  // Find all posts with pagination and author info
  async find(req) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || config.pageLimit
      const offset = (page - 1) * limit

      const { count, rows } = await Post.findAndCountAll({
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      })

      return {
        data: rows.map(post => post.toJSON()),
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      throw error
    }
  },

  // Find post by ID
  async findById(id) {
    try {
      const post = await Post.findByPk(id, {
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }]
      })
      
      if (!post) {
        throw new Error('Post not found')
      }

      return post.toJSON()
    } catch (error) {
      throw error
    }
  },

  // Insert new post
  async insert(data) {
    try {
      const { title, description, author_id } = data
      
      if (!title || !author_id) {
        throw new Error('Title and author_id are required')
      }

      // Check if author exists
      const author = await User.findByPk(author_id, {
        attributes: ['id', 'username']
      })
      
      if (!author) {
        throw new Error('Invalid author_id')
      }

      const post = await Post.create({
        title,
        description,
        author_id
      })

      // Load with author info
      await post.reload({
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }]
      })

      return post.toJSON()
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '))
      }
      throw error
    }
  },

  // Update post
  async update(id, data) {
    try {
      const { title, description } = data
      
      const post = await Post.findByPk(id)
      
      if (!post) {
        throw new Error('Post not found')
      }

      const updateData = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description

      if (Object.keys(updateData).length === 0) {
        throw new Error('No data to update')
      }

      await post.update(updateData)
      
      // Reload with author info
      await post.reload({
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }]
      })

      return post.toJSON()
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '))
      }
      throw error
    }
  },

  // Delete post
  async delete(id) {
    try {
      const post = await Post.findByPk(id)
      
      if (!post) {
        throw new Error('Post not found')
      }

      await post.destroy()
      return { message: 'Post deleted successfully' }
    } catch (error) {
      throw error
    }
  }
}

module.exports = { ...methods }