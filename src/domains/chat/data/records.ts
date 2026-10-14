/**
 * Persistence mappings owned by the chat team.
 */

import * as chatChatApi from "../../../../.cache/proto/acme/chat/v1/chat.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map chat bot API values to the database document boundary.
 */
export function toChatBotRecord(tenantId: string, value: chatChatApi.ChatBot): StoredRecord {
  return { tenantId, recordId: value.chatBotId, kind: "chat_bot",
    document: chatChatApi.ChatBot.toJSON(value) };
}

export function fromChatBotRecord(record: StoredRecord): chatChatApi.ChatBot {
  return chatChatApi.ChatBot.fromJSON(record.document);
}

/**
 * Map chat room API values to the database document boundary.
 */
export function toChatRoomRecord(tenantId: string, value: chatChatApi.ChatRoom): StoredRecord {
  return { tenantId, recordId: value.chatRoomId, kind: "chat_room",
    document: chatChatApi.ChatRoom.toJSON(value) };
}

export function fromChatRoomRecord(record: StoredRecord): chatChatApi.ChatRoom {
  return chatChatApi.ChatRoom.fromJSON(record.document);
}

/**
 * Map handoff API values to the database document boundary.
 */
export function toHandoffRecord(tenantId: string, value: chatChatApi.Handoff): StoredRecord {
  return { tenantId, recordId: value.handoffId, kind: "handoff",
    document: chatChatApi.Handoff.toJSON(value) };
}

export function fromHandoffRecord(record: StoredRecord): chatChatApi.Handoff {
  return chatChatApi.Handoff.fromJSON(record.document);
}
