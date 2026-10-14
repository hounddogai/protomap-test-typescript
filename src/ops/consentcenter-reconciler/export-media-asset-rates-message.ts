import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportMediaAssetRatesMessage keeps of each GetMediaAssetRates response. */
interface ExportMediaAssetRatesMessageRecord {
  message: string;
  correlationId: string;
  mediaAssetId: string;
}

/** Where exportMediaAssetRatesMessage hands each record. */
interface ExportMediaAssetRatesMessageSink {
  send(record: ExportMediaAssetRatesMessageRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.DeliveryAttemptValidationService. */
class ExportMediaAssetRatesMessageDeliveryAttemptValidation implements ExportMediaAssetRatesMessageSink {
  private readonly client: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportMediaAssetRatesMessageRecord): Promise<void> {
    await call<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse>(
      (request, done) => this.client.previewDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest.fromPartial({ deliveryAttempt: { deliveryAttemptId: record.mediaAssetId, kind: record.message } }));
  }
}

/** Hands records to acme.venues.v1.VenueValidationService. */
class ExportMediaAssetRatesMessageVenueValidation implements ExportMediaAssetRatesMessageSink {
  private readonly client: venuesVenueValidationServiceApi.VenueValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueValidationServiceApi.VenueValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportMediaAssetRatesMessageRecord): Promise<void> {
    await call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(
      (request, done) => this.client.explainVenueDecision(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({ details: { locale: record.message }, venue: { code: record.mediaAssetId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ExportMediaAssetRatesMessageLogOnly implements ExportMediaAssetRatesMessageSink {
  async send(record: ExportMediaAssetRatesMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverExportMediaAssetRatesMessage(kind: string, record: ExportMediaAssetRatesMessageRecord, runtime: Runtime): Promise<void> {
  let sink: ExportMediaAssetRatesMessageSink = new ExportMediaAssetRatesMessageLogOnly();
  switch (kind) {
    case "delivery-attempt-validation":
      sink = new ExportMediaAssetRatesMessageDeliveryAttemptValidation(runtime);
      break;
    case "venue-validation":
      sink = new ExportMediaAssetRatesMessageVenueValidation(runtime);
      break;
  }
  await sink.send(record);
}

/**
 * Reads acme.media.v1.MediaAssetCalculationService/GetMediaAssetRates and hands what it keeps to the sink of
 * its kind.
 */
export async function exportMediaAssetRatesMessage(runtime: Runtime): Promise<void> {
  const origin = new mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesRequest, mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesResponse>(
    (request, done) => origin.getMediaAssetRates(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    mediaMediaAssetCalculationServiceApi.GetMediaAssetRatesRequest.fromPartial({ mediaAssetId: "live-export-media-asset-rates-message" })));
  const kept: ExportMediaAssetRatesMessageRecord = {
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
    mediaAssetId: found.mediaAsset?.mediaAssetId ?? "",
  };
  await deliverExportMediaAssetRatesMessage("delivery-attempt-validation", kept, runtime);
}
