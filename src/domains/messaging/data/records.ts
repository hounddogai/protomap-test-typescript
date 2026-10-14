/**
 * Persistence mappings owned by the messaging team.
 */

import * as messagingMessagingApi from "../../../../.cache/proto/acme/messaging/v1/messaging.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map channel API values to the database document boundary.
 */
export function toChannelRecord(tenantId: string, value: messagingMessagingApi.Channel): StoredRecord {
  return { tenantId, recordId: value.channelId, kind: "channel",
    document: messagingMessagingApi.Channel.toJSON(value) };
}

export function fromChannelRecord(record: StoredRecord): messagingMessagingApi.Channel {
  return messagingMessagingApi.Channel.fromJSON(record.document);
}

/**
 * Map chat message API values to the database document boundary.
 */
export function toChatMessageRecord(tenantId: string, value: messagingMessagingApi.ChatMessage): StoredRecord {
  return { tenantId, recordId: value.chatMessageId, kind: "chat_message",
    document: messagingMessagingApi.ChatMessage.toJSON(value) };
}

export function fromChatMessageRecord(record: StoredRecord): messagingMessagingApi.ChatMessage {
  return messagingMessagingApi.ChatMessage.fromJSON(record.document);
}

/**
 * Map conversation API values to the database document boundary.
 */
export function toConversationRecord(tenantId: string, value: messagingMessagingApi.Conversation): StoredRecord {
  return { tenantId, recordId: value.conversationId, kind: "conversation",
    document: messagingMessagingApi.Conversation.toJSON(value) };
}

export function fromConversationRecord(record: StoredRecord): messagingMessagingApi.Conversation {
  return messagingMessagingApi.Conversation.fromJSON(record.document);
}

/**
 * Map participant API values to the database document boundary.
 */
export function toParticipantRecord(tenantId: string, value: messagingMessagingApi.Participant): StoredRecord {
  return { tenantId, recordId: value.participantId, kind: "participant",
    document: messagingMessagingApi.Participant.toJSON(value) };
}

export function fromParticipantRecord(record: StoredRecord): messagingMessagingApi.Participant {
  return messagingMessagingApi.Participant.fromJSON(record.document);
}
