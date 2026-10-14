import * as keymanagementCryptoKeyQueryServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as merchandisingCollectionQueryServiceApi from "../../../.cache/proto/acme/merchandising/v1/collection_query_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardCryptoKeysStatus keeps of each CountCryptoKeys response. */
interface ForwardCryptoKeysStatusRecord {
  status: string;
  message: string;
  correlationId: string;
}

/** Where forwardCryptoKeysStatus hands each record. */
interface ForwardCryptoKeysStatusSink {
  send(record: ForwardCryptoKeysStatusRecord): Promise<void>;
}

/** Writes records to acme.merchandising.v1.CollectionQueryService. */
class ForwardCryptoKeysStatusCollectionQuery implements ForwardCryptoKeysStatusSink {
  private readonly client: merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardCryptoKeysStatusRecord): Promise<void> {
    await call<merchandisingCollectionQueryServiceApi.LookupCollectionRequest, merchandisingCollectionQueryServiceApi.LookupCollectionResponse>(
      (request, done) => this.client.lookupCollection(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      merchandisingCollectionQueryServiceApi.LookupCollectionRequest.fromPartial({ collectionId: record.correlationId }));
  }
}

/** Hands records to acme.messaging.v1.ChatMessageValidationService. */
class ForwardCryptoKeysStatusChatMessageValidation implements ForwardCryptoKeysStatusSink {
  private readonly client: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardCryptoKeysStatusRecord): Promise<void> {
    await call<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse>(
      (request, done) => this.client.lintChatMessages(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChatMessageValidationServiceApi.LintChatMessagesRequest.fromPartial({ chatMessage: { chatMessageId: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardCryptoKeysStatusLogOnly implements ForwardCryptoKeysStatusSink {
  async send(record: ForwardCryptoKeysStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchForwardCryptoKeysStatus(kind: string, record: ForwardCryptoKeysStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: ForwardCryptoKeysStatusRecord): Promise<void> => new ForwardCryptoKeysStatusLogOnly().send(item);
  switch (kind) {
    case "collection-query":
      write = (item) => new ForwardCryptoKeysStatusCollectionQuery(runtime).send(item);
      break;
    case "chat-message-validation":
      write = (item) => new ForwardCryptoKeysStatusChatMessageValidation(runtime).send(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.keymanagement.v1.CryptoKeyQueryService/CountCryptoKeys and hands what it keeps to the sink of
 * its kind.
 */
export async function forwardCryptoKeysStatus(runtime: Runtime): Promise<void> {
  const reader = new keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysResponse>(
    (request, done) => reader.countCryptoKeys(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    keymanagementCryptoKeyQueryServiceApi.CountCryptoKeysRequest.fromPartial({ orderBy: "default-forward-crypto-keys-status" }));
  const entry: ForwardCryptoKeysStatusRecord = {
    status: found.result?.status ?? "",
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  await dispatchForwardCryptoKeysStatus("chat-message-validation", entry, runtime);
}
