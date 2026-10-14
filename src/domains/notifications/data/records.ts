/**
 * Persistence mappings owned by the notifications team.
 */

import * as notificationsNotificationsApi from "../../../../.cache/proto/acme/notifications/v1/notifications.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map delivery attempt API values to the database document boundary.
 */
export function toDeliveryAttemptRecord(tenantId: string, value: notificationsNotificationsApi.DeliveryAttempt): StoredRecord {
  return { tenantId, recordId: value.deliveryAttemptId, kind: "delivery_attempt",
    document: notificationsNotificationsApi.DeliveryAttempt.toJSON(value) };
}

export function fromDeliveryAttemptRecord(record: StoredRecord): notificationsNotificationsApi.DeliveryAttempt {
  return notificationsNotificationsApi.DeliveryAttempt.fromJSON(record.document);
}

/**
 * Map notification API values to the database document boundary.
 */
export function toNotificationRecord(tenantId: string, value: notificationsNotificationsApi.Notification): StoredRecord {
  return { tenantId, recordId: value.notificationId, kind: "notification",
    document: notificationsNotificationsApi.Notification.toJSON(value) };
}

export function fromNotificationRecord(record: StoredRecord): notificationsNotificationsApi.Notification {
  return notificationsNotificationsApi.Notification.fromJSON(record.document);
}

/**
 * Map notification template API values to the database document boundary.
 */
export function toNotificationTemplateRecord(tenantId: string, value: notificationsNotificationsApi.NotificationTemplate): StoredRecord {
  return { tenantId, recordId: value.notificationTemplateId, kind: "notification_template",
    document: notificationsNotificationsApi.NotificationTemplate.toJSON(value) };
}

export function fromNotificationTemplateRecord(record: StoredRecord): notificationsNotificationsApi.NotificationTemplate {
  return notificationsNotificationsApi.NotificationTemplate.fromJSON(record.document);
}

/**
 * Map subscription API values to the database document boundary.
 */
export function toSubscriptionRecord(tenantId: string, value: notificationsNotificationsApi.Subscription): StoredRecord {
  return { tenantId, recordId: value.subscriptionId, kind: "subscription",
    document: notificationsNotificationsApi.Subscription.toJSON(value) };
}

export function fromSubscriptionRecord(record: StoredRecord): notificationsNotificationsApi.Subscription {
  return notificationsNotificationsApi.Subscription.fromJSON(record.document);
}
