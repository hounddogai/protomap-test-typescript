import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as mediaMediaAssetServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as recruitingJobOpeningCalculationServiceApi from "../../../.cache/proto/acme/recruiting/v1/job_opening_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillJobOpeningId keeps of each QuoteJobOpening response. */
interface BackfillJobOpeningIdRecord {
  jobOpeningId: string;
  notes: string;
  number: string;
}

/** Where backfillJobOpeningId hands each record. */
interface BackfillJobOpeningIdDestination {
  deliver(record: BackfillJobOpeningIdRecord): Promise<void>;
}

/** Hands records to acme.keymanagement.v1.CryptoKeyCalculationService. */
class BackfillJobOpeningIdCryptoKeyCalculation implements BackfillJobOpeningIdDestination {
  private readonly client: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillJobOpeningIdRecord): Promise<void> {
    await call<keymanagementCryptoKeyCalculationServiceApi.CompareCryptoKeyOptionsRequest, keymanagementCryptoKeyCalculationServiceApi.CompareCryptoKeyOptionsResponse>(
      (request, done) => this.client.compareCryptoKeyOptions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      keymanagementCryptoKeyCalculationServiceApi.CompareCryptoKeyOptionsRequest.fromPartial({ cryptoKey: { cryptoKeyId: record.notes, currencyCode: record.jobOpeningId }, reason: record.number }));
  }
}

/** Hands records to acme.notifications.v1.NotificationTemplateQueryService. */
class BackfillJobOpeningIdNotificationTemplateQuery implements BackfillJobOpeningIdDestination {
  private readonly client: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillJobOpeningIdRecord): Promise<void> {
    await call<notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesResponse>(
      (request, done) => this.client.countNotificationTemplates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsNotificationTemplateQueryServiceApi.CountNotificationTemplatesRequest.fromPartial({ filter: { region: record.number } }));
  }
}

/** Sends records to acme.media.v1.MediaAssetService. */
class BackfillJobOpeningIdMediaAsset implements BackfillJobOpeningIdDestination {
  private readonly client: mediaMediaAssetServiceApi.MediaAssetServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetServiceApi.MediaAssetServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillJobOpeningIdRecord): Promise<void> {
    await call<mediaMediaAssetServiceApi.CreateMediaAssetRequest, mediaMediaAssetServiceApi.CreateMediaAssetResponse>(
      (request, done) => this.client.createMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetServiceApi.CreateMediaAssetRequest.fromPartial({ mediaAsset: { mediaAssetId: record.jobOpeningId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnBackfillJobOpeningId(kind: string, record: BackfillJobOpeningIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "crypto-key-calculation": () => new BackfillJobOpeningIdCryptoKeyCalculation(runtime).deliver(record),
    "notification-template-query": () => new BackfillJobOpeningIdNotificationTemplateQuery(runtime).deliver(record),
    "media-asset": () => new BackfillJobOpeningIdMediaAsset(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.recruiting.v1.JobOpeningCalculationService/QuoteJobOpening and hands what it keeps to the sink
 * of its kind.
 */
export async function backfillJobOpeningId(runtime: Runtime): Promise<void> {
  const source = new recruitingJobOpeningCalculationServiceApi.JobOpeningCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<recruitingJobOpeningCalculationServiceApi.QuoteJobOpeningRequest, recruitingJobOpeningCalculationServiceApi.QuoteJobOpeningResponse>(
    (request, done) => source.quoteJobOpening(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    recruitingJobOpeningCalculationServiceApi.QuoteJobOpeningRequest.fromPartial({ jobOpeningId: "current-backfill-job-opening-id" }));
  const entry: BackfillJobOpeningIdRecord = {
    jobOpeningId: current.jobOpening?.jobOpeningId ?? "",
    notes: current.jobOpening?.notes ?? "",
    number: current.jobOpening?.number ?? "",
  };
  await actOnBackfillJobOpeningId("notification-template-query", entry, runtime);
}
