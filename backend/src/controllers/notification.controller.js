const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserNotifications = async (req, res) => {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ notifications });
};

exports.markAsRead = async (req, res) => {
  const notificationId = req.params.id;

  try {
    const updated = await prisma.notification.updateMany({
      where: { id: notificationId },
      data: { isRead: true },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


exports.createNotification = async (req, res) => {
  const { userId, content, link, type = 'SYSTEM' } = req.body;

  const notification = await prisma.notification.create({
    data: {
      userId,
      content,
      link,
      type,
    },
  });

  res.status(201).json(notification);
};

exports.sendManualNotification = async (req, res) => {
  const { userId, content, link = '/dashboard' } = req.body;
  const io = req.app.get('io');

  if (!userId || !content) {
    return res.status(400).json({ message: 'Missing userId or content' });
  }

  try {
    console.log('💌 Nowa notyfikacja dla:', userId, content);

    const notification = await prisma.notification.create({
      data: {
        userId,
        content,
        link,
        type: 'SYSTEM',
      },
    });

    io.emit(`notification:${userId}`, notification);

    res.status(201).json(notification);
  } catch (err) {
    console.error('Manual notification error:', err);
    res.status(500).json({ message: 'Błąd wysyłania powiadomienia' });
  }
};

exports.markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true });
};

exports.testNotification = async (req, res) => {
  const { userId } = req.params;
  const io = req.app.get('io');

  const newNotification = await prisma.notification.create({
    data: {
      userId,
      content: '🔔 To jest testowe powiadomienie',
      link: '/dashboard',
      type: 'SYSTEM',
    },
  });

  io.emit(`notification:${userId}`, newNotification);

  res.json(newNotification);
};
