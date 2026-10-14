import * as giftcardsGiftCardServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_service.js";
import * as ordersOrderServiceApi from "../../../.cache/proto/acme/orders/v1/order_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
import * as telematicsTelemetryReadingQueryServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncTelemetryReadingsMessage keeps of each SuggestTelemetryReadings response. */
interface SyncTelemetryReadingsMessageRecord {
  message: string;
  nextPageToken: string;
  correlationId: string;
}

/** Where syncTelemetryReadingsMessage hands each record. */
interface SyncTelemetryReadingsMessageWriter {
  deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void>;
}

/** Hands records to acme.recruiting.v1.JobOpeningCalculationService. */
class SyncTelemetryReadingsMessageJobOpeningCalculation implements SyncTelemetryReadingsMessageWriter {
  private readonly client: recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void> {
    await retry(() => call<recruitingJobOpeningCalculationServiceApi.CompareJobOpeningOptionsRequest, recruitingJobOpeningCalculationServiceApi.CompareJobOpeningOptionsResponse>(
      (request, done) => this.client.compareJobOpeningOptions(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      recruitingJobOpeningCalculationServiceApi.CompareJobOpeningOptionsRequest.fromPartial({ jobOpening: { notes: record.nextPageToken } })));
  }
}

/** Sends records to acme.giftcards.v1.GiftCardService. */
class SyncTelemetryReadingsMessageGiftCard implements SyncTelemetryReadingsMessageWriter {
  private readonly client: giftcardsGiftCardServiceApi.GiftCardServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new giftcardsGiftCardServiceApi.GiftCardServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void> {
    await call<giftcardsGiftCardServiceApi.SearchGiftCardsRequest, giftcardsGiftCardServiceApi.SearchGiftCardsResponse>(
      (request, done) => this.client.searchGiftCards(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      giftcardsGiftCardServiceApi.SearchGiftCardsRequest.fromPartial({ page: { pageToken: record.message }, filter: { query: record.nextPageToken, region: record.correlationId } }));
  }
}

/** Passes records to acme.orders.v1.OrderService. */
class SyncTelemetryReadingsMessageOrder implements SyncTelemetryReadingsMessageWriter {
  private readonly client: ordersOrderServiceApi.OrderServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ordersOrderServiceApi.OrderServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void> {
    await retry(() => call<ordersOrderServiceApi.GetOrderRequest, ordersOrderServiceApi.GetOrderResponse>(
      (request, done) => this.client.getOrder(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      ordersOrderServiceApi.GetOrderRequest.fromPartial({ orderId: record.message })));
  }
}

/** Hands records to acme.telematics.v1.TelemetryReadingQueryService. */
class SyncTelemetryReadingsMessageTelemetryReadingQuery implements SyncTelemetryReadingsMessageWriter {
  private readonly client: telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void> {
    await call<telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingRequest, telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingResponse>(
      (request, done) => this.client.peekTelemetryReading(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      telematicsTelemetryReadingQueryServiceApi.PeekTelemetryReadingRequest.fromPartial({ telemetryReadingId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SyncTelemetryReadingsMessageLogOnly implements SyncTelemetryReadingsMessageWriter {
  async deliver(record: SyncTelemetryReadingsMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverSyncTelemetryReadingsMessage(kind: string, record: SyncTelemetryReadingsMessageRecord, runtime: Runtime): Promise<void> {
  let sink: SyncTelemetryReadingsMessageWriter = new SyncTelemetryReadingsMessageLogOnly();
  switch (kind) {
    case "job-opening-calculation":
      sink = new SyncTelemetryReadingsMessageJobOpeningCalculation(runtime);
      break;
    case "gift-card":
      sink = new SyncTelemetryReadingsMessageGiftCard(runtime);
      break;
    case "order":
      sink = new SyncTelemetryReadingsMessageOrder(runtime);
      break;
    case "telemetry-reading-query":
      sink = new SyncTelemetryReadingsMessageTelemetryReadingQuery(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.telematics.v1.TelemetryReadingQueryService/SuggestTelemetryReadings and hands what it keeps to
 * the sink of its kind.
 */
export async function syncTelemetryReadingsMessage(runtime: Runtime): Promise<void> {
  const origin = new telematicsTelemetryReadingQueryServiceApi.TelemetryReadingQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsRequest, telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsResponse>(
    (request, done) => origin.suggestTelemetryReadings(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    telematicsTelemetryReadingQueryServiceApi.SuggestTelemetryReadingsRequest.fromPartial({ orderBy: "default-sync-telemetry-readings-message" })));
  const entry: SyncTelemetryReadingsMessageRecord = {
    message: response.result?.message ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    correlationId: text.normalize(response.result?.correlationId ?? ""),
  };
  await deliverSyncTelemetryReadingsMessage("gift-card", entry, runtime);
}
