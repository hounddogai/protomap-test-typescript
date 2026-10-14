import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as fuelFuelCardCalculationServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_calculation_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryFuelCardCode keeps of each CalculateFuelCard response. */
interface CarryFuelCardCodeRecord {
  currencyCode: string;
  fuelCardId: string;
}

/** Where carryFuelCardCode hands each record. */
interface CarryFuelCardCodeSink {
  apply(record: CarryFuelCardCodeRecord): Promise<void>;
}

/** Hands records to acme.media.v1.MediaAssetReportingService. */
class CarryFuelCardCodeMediaAssetReporting implements CarryFuelCardCodeSink {
  private readonly client: mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryFuelCardCodeRecord): Promise<void> {
    await call<mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportResponse>(
      (request, done) => this.client.scheduleMediaAssetReport(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaMediaAssetReportingServiceApi.ScheduleMediaAssetReportRequest.fromPartial({ details: { cron: record.fuelCardId, format: record.currencyCode } }));
  }
}

/** Passes records to acme.messaging.v1.ChatMessageLifecycleService. */
class CarryFuelCardCodeChatMessageLifecycle implements CarryFuelCardCodeSink {
  private readonly client: messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryFuelCardCodeRecord): Promise<void> {
    await call<messagingChatMessageLifecycleServiceApi.SuspendChatMessageRequest, messagingChatMessageLifecycleServiceApi.SuspendChatMessageResponse>(
      (request, done) => this.client.suspendChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChatMessageLifecycleServiceApi.SuspendChatMessageRequest.fromPartial({ reason: record.fuelCardId }));
  }
}

/** Passes records to acme.messaging.v1.ConversationLifecycleService. */
class CarryFuelCardCodeConversationLifecycle implements CarryFuelCardCodeSink {
  private readonly client: messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryFuelCardCodeRecord): Promise<void> {
    await call<messagingConversationLifecycleServiceApi.RenewConversationRequest, messagingConversationLifecycleServiceApi.RenewConversationResponse>(
      (request, done) => this.client.renewConversation(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingConversationLifecycleServiceApi.RenewConversationRequest.fromPartial({ reason: record.currencyCode }));
  }
}

/** Sends records to acme.audiences.v1.AudienceMemberApprovalService. */
class CarryFuelCardCodeAudienceMemberApproval implements CarryFuelCardCodeSink {
  private readonly client: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryFuelCardCodeRecord): Promise<void> {
    await retry(() => call<audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersRequest, audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersResponse>(
      (request, done) => this.client.listPendingAudienceMembers(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceMemberApprovalServiceApi.ListPendingAudienceMembersRequest.fromPartial({ page: { pageToken: record.fuelCardId }, filter: { ownerId: record.currencyCode } })));
  }
}

/**
 * Reads acme.fuel.v1.FuelCardCalculationService/CalculateFuelCard and hands what it keeps to the sink of its
 * kind.
 */
export async function carryFuelCardCode(runtime: Runtime): Promise<void> {
  const reader = new fuelFuelCardCalculationServiceApi.FuelCardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest, fuelFuelCardCalculationServiceApi.CalculateFuelCardResponse>(
    (request, done) => reader.calculateFuelCard(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    fuelFuelCardCalculationServiceApi.CalculateFuelCardRequest.fromPartial({ reason: "default-carry-fuel-card-code" }));
  const record: CarryFuelCardCodeRecord = {
    currencyCode: found.breakdown?.currencyCode ?? "",
    fuelCardId: text.normalize(found.fuelCard?.fuelCardId ?? ""),
  };
  const sinks = new Map<string, CarryFuelCardCodeSink>();
  sinks.set("media-asset-reporting", new CarryFuelCardCodeMediaAssetReporting(runtime));
  sinks.set("chat-message-lifecycle", new CarryFuelCardCodeChatMessageLifecycle(runtime));
  sinks.set("conversation-lifecycle", new CarryFuelCardCodeConversationLifecycle(runtime));
  sinks.set("audience-member-approval", new CarryFuelCardCodeAudienceMemberApproval(runtime));
  await sinks.get("chat-message-lifecycle")!.apply(record);
}
