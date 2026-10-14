/**
 * Persistence mappings owned by the webhooks team.
 */

import * as webhooksWebhooksApi from "../../../../.cache/proto/acme/webhooks/v1/webhooks.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map webhook delivery API values to the database document boundary.
 */
export function toWebhookDeliveryRecord(tenantId: string, value: webhooksWebhooksApi.WebhookDelivery): StoredRecord {
  return { tenantId, recordId: value.webhookDeliveryId, kind: "webhook_delivery",
    document: webhooksWebhooksApi.WebhookDelivery.toJSON(value) };
}

export function fromWebhookDeliveryRecord(record: StoredRecord): webhooksWebhooksApi.WebhookDelivery {
  return webhooksWebhooksApi.WebhookDelivery.fromJSON(record.document);
}

/**
 * Map webhook endpoint API values to the database document boundary.
 */
export function toWebhookEndpointRecord(tenantId: string, value: webhooksWebhooksApi.WebhookEndpoint): StoredRecord {
  return { tenantId, recordId: value.webhookEndpointId, kind: "webhook_endpoint",
    document: webhooksWebhooksApi.WebhookEndpoint.toJSON(value) };
}

export function fromWebhookEndpointRecord(record: StoredRecord): webhooksWebhooksApi.WebhookEndpoint {
  return webhooksWebhooksApi.WebhookEndpoint.fromJSON(record.document);
}

/**
 * Map webhook secret API values to the database document boundary.
 */
export function toWebhookSecretRecord(tenantId: string, value: webhooksWebhooksApi.WebhookSecret): StoredRecord {
  return { tenantId, recordId: value.webhookSecretId, kind: "webhook_secret",
    document: webhooksWebhooksApi.WebhookSecret.toJSON(value) };
}

export function fromWebhookSecretRecord(record: StoredRecord): webhooksWebhooksApi.WebhookSecret {
  return webhooksWebhooksApi.WebhookSecret.fromJSON(record.document);
}
