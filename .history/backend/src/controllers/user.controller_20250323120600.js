const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        login: true,
        email: true,
        isActive: true,
        lastLogin: true,
        lastActivity: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.user.count();
    
    const formattedUsers = users.map(user => ({
      ...user,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name
      })),
      userRoles: undefined
    }));
    
    res.json({
      users: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        login: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        lastLogin: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId: id },
      include: {
        permission: {
          select: {
            id: true,
            module: true,
            action: true
          }
        }
      }
    });
    
    const formattedUser = {
      ...user,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name
      })),
      permissions: userPermissions.map(up => ({
        id: up.permission.id,
        module: up.permission.module,
        action: up.permission.action,
        value: up.value
      })),
      userRoles: undefined
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error retrieving user' });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      login, 
      email, 
      phoneNumber, 
      password,
      roles = [] 
    } = req.body;
    
    // Check if user with this login or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { login },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this login or email already exists' 
      });
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the user in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          login,
          email,
          phoneNumber,
          passwordHash,
          isActive: true
        }
      });
      
      // Assign roles
      if (roles.length > 0) {
        const roleAssignments = roles.map(roleId => ({
          roleId,
          userId: user.id
        }));
        
        await tx.userRole.createMany({
          data: roleAssignments
        });
      }
      
      return user;
    });
    
    res.status(201).json({
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      login: newUser.login,
      email: newUser.email,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      isActive,
      password,
      roles
    } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user data
    const updateData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      isActive
    };
    
    // If password is provided, hash it
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    // Update in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id },
        data: updateData
      });
      
      // Update roles if provided
      if (roles && Array.isArray(roles)) {
        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { userId: id }
        });
        
        // Add new roles
        if (roles.length > 0) {
          const roleAssignments = roles.map(roleId => ({
            roleId,
            userId: id
          }));
          
          await tx.userRole.createMany({
            data: roleAssignments
          });
        }
      }
    });
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete user roles
      await tx.userRole.deleteMany({
        where: { userId: id }
      });
      
      // Delete user permissions
      await tx.userPermission.deleteMany({
        where: { userId: id }
      });
      
      // Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId: id }
      });
      
      // Delete user
      await tx.user.delete({
        where: { id }
      });
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};