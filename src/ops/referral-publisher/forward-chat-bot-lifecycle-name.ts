import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as featurestoreFeatureViewServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_service.js";
import * as localizationLocaleQueryServiceApi from "../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardChatBotLifecycleName keeps of each GetChatBotLifecycle response. */
interface ForwardChatBotLifecycleNameRecord {
  name: string;
  status: string;
  correlationId: string;
}

/** Where forwardChatBotLifecycleName hands each record. */
interface ForwardChatBotLifecycleNameSink {
  write(record: ForwardChatBotLifecycleNameRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.LocaleQueryService. */
class ForwardChatBotLifecycleNameLocaleQuery implements ForwardChatBotLifecycleNameSink {
  private readonly client: localizationLocaleQueryServiceApi.LocaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleQueryServiceApi.LocaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardChatBotLifecycleNameRecord): Promise<void> {
    await retry(() => call<localizationLocaleQueryServiceApi.PeekLocaleRequest, localizationLocaleQueryServiceApi.PeekLocaleResponse>(
      (request, done) => this.client.peekLocale(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationLocaleQueryServiceApi.PeekLocaleRequest.fromPartial({ localeId: record.correlationId })));
  }
}

/** Writes records to acme.featurestore.v1.FeatureViewService. */
class ForwardChatBotLifecycleNameFeatureView implements ForwardChatBotLifecycleNameSink {
  private readonly client: featurestoreFeatureViewServiceApi.FeatureViewServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featurestoreFeatureViewServiceApi.FeatureViewServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardChatBotLifecycleNameRecord): Promise<void> {
    await retry(() => call<featurestoreFeatureViewServiceApi.CloneFeatureViewRequest, featurestoreFeatureViewServiceApi.CloneFeatureViewResponse>(
      (request, done) => this.client.cloneFeatureView(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      featurestoreFeatureViewServiceApi.CloneFeatureViewRequest.fromPartial({ featureView: { featureViewId: record.name, code: record.status } })));
  }
}

/**
 * Reads acme.chat.v1.ChatBotLifecycleService/GetChatBotLifecycle and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardChatBotLifecycleName(runtime: Runtime): Promise<void> {
  const upstream = new chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest, chatChatBotLifecycleServiceApi.GetChatBotLifecycleResponse>(
    (request, done) => upstream.getChatBotLifecycle(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatChatBotLifecycleServiceApi.GetChatBotLifecycleRequest.fromPartial({ chatBotId: "nightly-forward-chat-bot-lifecycle-name" }));
  const entry: ForwardChatBotLifecycleNameRecord = {
    name: response.chatBot?.name ?? "",
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: ForwardChatBotLifecycleNameSink[] = [
    new ForwardChatBotLifecycleNameLocaleQuery(runtime),
    new ForwardChatBotLifecycleNameFeatureView(runtime),
  ];
  await sinks[1]!.write(entry);
}
