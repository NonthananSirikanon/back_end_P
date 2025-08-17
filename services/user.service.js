const { User } = require('../models')
const jwt = require('jsonwebtoken')
const config = require('../configs/app')
const { Op } = require('sequelize')

const methods = {
  // Find all users with pagination
  async find(req) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || config.pageLimit
      const offset = (page - 1) * limit

      const { count, rows } = await User.findAndCountAll({
        attributes: ['id', 'username', 'email', 'age', 'birthday', 'created_at', 'updated_at'],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      })

      return {
        data: rows.map(user => user.toJSON()),
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

  // Find user by ID
  async findById(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'username', 'email', 'age', 'birthday', 'created_at', 'updated_at']
      })
      
      if (!user) {
        throw new Error('User not found')
      }

      return user.toJSON()
    } catch (error) {
      throw error
    }
  },

  // Insert new user
  async insert(data) {
    try {
      const { username, password, email, age, birthday } = data
      
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      const user = await User.create({
        username,
        password,
        email,
        age,
        birthday
      })
      
      const token = user.generateJWT()

      return {
        user: user.toJSON(),
        token
      }
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Username already exists')
      }
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '))
      }
      throw error
    }
  },

  // Update user
  async update(id, data) {
    try {
      const { username, password, email, age, birthday } = data
      
      const user = await User.findByPk(id)
      
      if (!user) {
        throw new Error('User not found')
      }

      const updateData = {}
      if (username !== undefined) updateData.username = username
      if (password !== undefined) updateData.password = password
      if (email !== undefined) updateData.email = email
      if (age !== undefined) updateData.age = age
      if (birthday !== undefined) updateData.birthday = birthday

      if (Object.keys(updateData).length === 0) {
        throw new Error('No data to update')
      }

      await user.update(updateData)
      await user.reload()

      return user.toJSON()
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Username already exists')
      }
      if (error.name === 'SequelizeValidationError') {
        throw new Error(error.errors.map(e => e.message).join(', '))
      }
      throw error
    }
  },

  // Delete user
  async delete(id) {
    try {
      const user = await User.findByPk(id)
      
      if (!user) {
        throw new Error('User not found')
      }

      await user.destroy()
      return { message: 'User deleted successfully' }
    } catch (error) {
      throw error
    }
  },

  // Login
  async login(data) {
    try {
      const { username, password } = data
      
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      const user = await User.findOne({
        where: { username }
      })
      
      if (!user) {
        throw new Error('Invalid username or password')
      }
      
      if (!user.validPassword(password)) {
        throw new Error('Invalid username or password')
      }

      const token = user.generateJWT()

      return {
        user: user.toJSON(),
        token
      }
    } catch (error) {
      throw error
    }
  },

  // Refresh token
  async refreshToken(accessToken) {
    try {
      const decoded = jwt.verify(accessToken, config.secret, { ignoreExpiration: true })
      
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'email', 'age', 'birthday', 'created_at', 'updated_at']
      })
      
      if (!user) {
        throw new Error('User not found')
      }

      const newToken = user.generateJWT()

      return {
        user: user.toJSON(),
        token: newToken
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
}

module.exports = { ...methods }