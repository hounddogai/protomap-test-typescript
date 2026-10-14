import * as chatChatRoomValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as localizationLocaleLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/locale_lifecycle_service.js";
import * as localizationLocaleQueryServiceApi from "../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateChatRoomRulesStatus keeps of each GetChatRoomRules response. */
interface PropagateChatRoomRulesStatusRecord {
  status: string;
  chatRoomId: string;
}

/** Where propagateChatRoomRulesStatus hands each record. */
interface PropagateChatRoomRulesStatusSink {
  send(record: PropagateChatRoomRulesStatusRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.LocaleQueryService. */
class PropagateChatRoomRulesStatusLocaleQuery implements PropagateChatRoomRulesStatusSink {
  private readonly client: localizationLocaleQueryServiceApi.LocaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleQueryServiceApi.LocaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PropagateChatRoomRulesStatusRecord): Promise<void> {
    await call<localizationLocaleQueryServiceApi.FindLocalesRequest, localizationLocaleQueryServiceApi.FindLocalesResponse>(
      (request, done) => this.client.findLocales(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      localizationLocaleQueryServiceApi.FindLocalesRequest.fromPartial({ filter: { region: record.status } }));
  }
}

/** Hands records to acme.localization.v1.LocaleLifecycleService. */
class PropagateChatRoomRulesStatusLocaleLifecycle implements PropagateChatRoomRulesStatusSink {
  private readonly client: localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleLifecycleServiceApi.LocaleLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: PropagateChatRoomRulesStatusRecord): Promise<void> {
    await call<localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest, localizationLocaleLifecycleServiceApi.ReinstateLocaleResponse>(
      (request, done) => this.client.reinstateLocale(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationLocaleLifecycleServiceApi.ReinstateLocaleRequest.fromPartial({ reason: record.chatRoomId }));
  }
}

/**
 * Reads acme.chat.v1.ChatRoomValidationService/GetChatRoomRules and hands what it keeps to the sink of its
 * kind.
 */
export async function propagateChatRoomRulesStatus(runtime: Runtime): Promise<void> {
  const source = new chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<chatChatRoomValidationServiceApi.GetChatRoomRulesRequest, chatChatRoomValidationServiceApi.GetChatRoomRulesResponse>(
    (request, done) => source.getChatRoomRules(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    chatChatRoomValidationServiceApi.GetChatRoomRulesRequest.fromPartial({ chatRoomId: "main-propagate-chat-room-rules-status" }));
  const entry: PropagateChatRoomRulesStatusRecord = {
    status: reply.result?.status ?? "",
    chatRoomId: reply.chatRoom?.chatRoomId ?? "",
  };
  const sinks: PropagateChatRoomRulesStatusSink[] = [
    new PropagateChatRoomRulesStatusLocaleQuery(runtime),
    new PropagateChatRoomRulesStatusLocaleLifecycle(runtime),
  ];
  await sinks[1]!.send(entry);
}
