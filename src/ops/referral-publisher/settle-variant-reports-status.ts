import * as chatChatRoomCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as experimentsVariantReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as featurestoreFeatureViewServiceApi from "../../../.cache/proto/acme/featurestore/v1/feature_view_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleVariantReportsStatus keeps of each ListVariantReports response. */
interface SettleVariantReportsStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
  message: string;
}

/** Where settleVariantReportsStatus hands each record. */
interface SettleVariantReportsStatusWriter {
  send(record: SettleVariantReportsStatusRecord): Promise<void>;
}

/** Passes records to acme.notifications.v1.DeliveryAttemptSyncService. */
class SettleVariantReportsStatusDeliveryAttemptSync implements SettleVariantReportsStatusWriter {
  private readonly client: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleVariantReportsStatusRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsResponse>(
      (request, done) => this.client.reconcileDeliveryAttempts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptSyncServiceApi.ReconcileDeliveryAttemptsRequest.fromPartial({ details: { checksum: record.correlationId, peerRegion: record.status } })));
  }
}

/** Sends records to acme.chat.v1.ChatRoomCalculationService. */
class SettleVariantReportsStatusChatRoomCalculation implements SettleVariantReportsStatusWriter {
  private readonly client: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleVariantReportsStatusRecord): Promise<void> {
    await retry(() => call<chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest, chatChatRoomCalculationServiceApi.CompareChatRoomOptionsResponse>(
      (request, done) => this.client.compareChatRoomOptions(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatChatRoomCalculationServiceApi.CompareChatRoomOptionsRequest.fromPartial({ chatRoom: { name: record.nextPageToken } })));
  }
}

/** Sends records to acme.featurestore.v1.FeatureViewService. */
class SettleVariantReportsStatusFeatureView implements SettleVariantReportsStatusWriter {
  private readonly client: featurestoreFeatureViewServiceApi.FeatureViewServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featurestoreFeatureViewServiceApi.FeatureViewServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleVariantReportsStatusRecord): Promise<void> {
    await call<featurestoreFeatureViewServiceApi.CreateFeatureViewRequest, featurestoreFeatureViewServiceApi.CreateFeatureViewResponse>(
      (request, done) => this.client.createFeatureView(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      featurestoreFeatureViewServiceApi.CreateFeatureViewRequest.fromPartial({ featureView: { name: record.message, code: record.status } }));
  }
}

/**
 * Reads acme.experiments.v1.VariantReportingService/ListVariantReports and hands what it keeps to the sink of
 * its kind.
 */
export async function settleVariantReportsStatus(runtime: Runtime): Promise<void> {
  const reader = new experimentsVariantReportingServiceApi.VariantReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<experimentsVariantReportingServiceApi.ListVariantReportsRequest, experimentsVariantReportingServiceApi.ListVariantReportsResponse>(
    (request, done) => reader.listVariantReports(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsVariantReportingServiceApi.ListVariantReportsRequest.fromPartial({ orderBy: "main-settle-variant-reports-status" })));
  const record: SettleVariantReportsStatusRecord = {
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    message: response.result?.message ?? "",
  };
  const sinks: SettleVariantReportsStatusWriter[] = [
    new SettleVariantReportsStatusDeliveryAttemptSync(runtime),
    new SettleVariantReportsStatusChatRoomCalculation(runtime),
    new SettleVariantReportsStatusFeatureView(runtime),
  ];
  await sinks[0]!.send(record);
}
