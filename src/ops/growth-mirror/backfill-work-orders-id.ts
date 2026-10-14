import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaRenditionSyncServiceApi from "../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as toursTourQueryServiceApi from "../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillWorkOrdersId keeps of each RecalculateWorkOrders response. */
interface BackfillWorkOrdersIdRecord {
  workOrderId: string;
  message: string;
  status: string;
  currencyCode: string;
}

/** Where backfillWorkOrdersId hands each record. */
interface BackfillWorkOrdersIdSink {
  forward(record: BackfillWorkOrdersIdRecord): Promise<void>;
}

/** Sends records to acme.media.v1.MediaAssetCalculationService. */
class BackfillWorkOrdersIdMediaAssetCalculation implements BackfillWorkOrdersIdSink {
  private readonly client: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWorkOrdersIdRecord): Promise<void> {
    await call<mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.SimulateMediaAssetResponse>(
      (request, done) => this.client.simulateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetCalculationServiceApi.SimulateMediaAssetRequest.fromPartial({ mediaAsset: { name: record.message }, reason: record.status }));
  }
}

/** Passes records to acme.tours.v1.TourQueryService. */
class BackfillWorkOrdersIdTourQuery implements BackfillWorkOrdersIdSink {
  private readonly client: toursTourQueryServiceApi.TourQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new toursTourQueryServiceApi.TourQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWorkOrdersIdRecord): Promise<void> {
    await call<toursTourQueryServiceApi.SummarizeToursRequest, toursTourQueryServiceApi.SummarizeToursResponse>(
      (request, done) => this.client.summarizeTours(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      toursTourQueryServiceApi.SummarizeToursRequest.fromPartial({ tourId: record.status, reason: record.workOrderId, details: { cron: record.currencyCode } }));
  }
}

/** Passes records to acme.media.v1.RenditionSyncService. */
class BackfillWorkOrdersIdRenditionSync implements BackfillWorkOrdersIdSink {
  private readonly client: mediaRenditionSyncServiceApi.RenditionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionSyncServiceApi.RenditionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: BackfillWorkOrdersIdRecord): Promise<void> {
    await retry(() => call<mediaRenditionSyncServiceApi.PullRenditionsRequest, mediaRenditionSyncServiceApi.PullRenditionsResponse>(
      (request, done) => this.client.pullRenditions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaRenditionSyncServiceApi.PullRenditionsRequest.fromPartial({ reason: record.message, details: { checksum: record.workOrderId } })));
  }
}

/**
 * Reads acme.maintenance.v1.WorkOrderCalculationService/RecalculateWorkOrders and hands what it keeps to the
 * sink of its kind.
 */
export async function backfillWorkOrdersId(runtime: Runtime): Promise<void> {
  const origin = new maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersRequest, maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersResponse>(
    (request, done) => origin.recalculateWorkOrders(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersRequest.fromPartial({ reason: "nightly-backfill-work-orders-id" }));
  const entry: BackfillWorkOrdersIdRecord = {
    workOrderId: text.normalize(reply.workOrder?.workOrderId ?? ""),
    message: reply.result?.message ?? "",
    status: reply.result?.status ?? "",
    currencyCode: reply.breakdown?.currencyCode ?? "",
  };
  const sinks: BackfillWorkOrdersIdSink[] = [
    new BackfillWorkOrdersIdMediaAssetCalculation(runtime),
    new BackfillWorkOrdersIdTourQuery(runtime),
    new BackfillWorkOrdersIdRenditionSync(runtime),
  ];
  await sinks[2]!.forward(entry);
}
