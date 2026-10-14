import * as chatChatBotCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as contentContentRevisionWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_workflow_service.js";
import * as deliveriesDeliveryServiceApi from "../../../.cache/proto/acme/deliveries/v1/delivery_service.js";
import * as personalizationProfileReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillChatBotsId keeps of each RecalculateChatBots response. */
interface BackfillChatBotsIdRecord {
  chatBotId: string;
  status: string;
}

/** Where backfillChatBotsId hands each record. */
interface BackfillChatBotsIdDestination {
  apply(record: BackfillChatBotsIdRecord): Promise<void>;
}

/** Hands records to acme.deliveries.v1.DeliveryService. */
class BackfillChatBotsIdDelivery implements BackfillChatBotsIdDestination {
  private readonly client: deliveriesDeliveryServiceApi.DeliveryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new deliveriesDeliveryServiceApi.DeliveryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotsIdRecord): Promise<void> {
    await call<deliveriesDeliveryServiceApi.CreateDeliveryRequest, deliveriesDeliveryServiceApi.CreateDeliveryResponse>(
      (request, done) => this.client.createDelivery(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      deliveriesDeliveryServiceApi.CreateDeliveryRequest.fromPartial({ delivery: { number: record.status, deliveryId: record.chatBotId } }));
  }
}

/** Sends records to acme.content.v1.ContentRevisionWorkflowService. */
class BackfillChatBotsIdContentRevisionWorkflow implements BackfillChatBotsIdDestination {
  private readonly client: contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionWorkflowServiceApi.ContentRevisionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotsIdRecord): Promise<void> {
    await call<contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest, contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsResponse>(
      (request, done) => this.client.listContentRevisionWorkflows(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      contentContentRevisionWorkflowServiceApi.ListContentRevisionWorkflowsRequest.fromPartial({ orderBy: record.chatBotId, page: { pageToken: record.status } }));
  }
}

/** Writes records to acme.personalization.v1.ProfileReportingService. */
class BackfillChatBotsIdProfileReporting implements BackfillChatBotsIdDestination {
  private readonly client: personalizationProfileReportingServiceApi.ProfileReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileReportingServiceApi.ProfileReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillChatBotsIdRecord): Promise<void> {
    await call<personalizationProfileReportingServiceApi.GenerateProfileReportRequest, personalizationProfileReportingServiceApi.GenerateProfileReportResponse>(
      (request, done) => this.client.generateProfileReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationProfileReportingServiceApi.GenerateProfileReportRequest.fromPartial({ reason: record.status, details: { cron: record.chatBotId } }));
  }
}

/**
 * Reads acme.chat.v1.ChatBotCalculationService/RecalculateChatBots and hands what it keeps to the sink of its
 * kind.
 */
export async function backfillChatBotsId(runtime: Runtime): Promise<void> {
  const source = new chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<chatChatBotCalculationServiceApi.RecalculateChatBotsRequest, chatChatBotCalculationServiceApi.RecalculateChatBotsResponse>(
    (request, done) => source.recalculateChatBots(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    chatChatBotCalculationServiceApi.RecalculateChatBotsRequest.fromPartial({ reason: "current-backfill-chat-bots-id" }));
  const row: BackfillChatBotsIdRecord = {
    chatBotId: reply.chatBot?.chatBotId ?? "",
    status: reply.result?.status ?? "",
  };
  const registry: Record<string, BackfillChatBotsIdDestination> = {};
  for (const entry of [
    { kind: "delivery", sink: new BackfillChatBotsIdDelivery(runtime) },
    { kind: "content-revision-workflow", sink: new BackfillChatBotsIdContentRevisionWorkflow(runtime) },
    { kind: "profile-reporting", sink: new BackfillChatBotsIdProfileReporting(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["profile-reporting"]!.apply(row);
}
