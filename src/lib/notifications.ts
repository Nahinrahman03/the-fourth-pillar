import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/db";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: input
  });
}

export async function broadcastNotification(input: {
  title: string;
  body: string;
  href?: string;
}) {
  const recipients = await prisma.profile.findMany({
    where: {
      notifyInApp: true
    },
    select: {
      userId: true
    }
  });

  if (recipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.userId,
      type: NotificationType.SYSTEM,
      title: input.title,
      body: input.body,
      href: input.href
    }))
  });
}

export async function notifyElevatedUsers(input: {
  title: string;
  body: string;
  href?: string;
  type?: NotificationType;
}) {
  const recipients = await prisma.user.findMany({
    where: {
      role: "ADMIN"
    },
    select: {
      id: true
    }
  });

  if (recipients.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type: input.type ?? NotificationType.SYSTEM,
      title: input.title,
      body: input.body,
      href: input.href
    }))
  });
}
