import * as driverappDriverHomeQueryServiceApi from "../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as formsFormSubmissionCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_calculation_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as ratelimitingRateLimitServiceApi from "../../../.cache/proto/acme/ratelimiting/v1/rate_limit_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleFormSubmissionRatesMessage keeps of each GetFormSubmissionRates response. */
interface SettleFormSubmissionRatesMessageRecord {
  message: string;
  formSubmissionId: string;
  source: string;
  correlationId: string;
}

/** Where settleFormSubmissionRatesMessage hands each record. */
interface SettleFormSubmissionRatesMessageTarget {
  forward(record: SettleFormSubmissionRatesMessageRecord): Promise<void>;
}

/** Sends records to acme.media.v1.MediaAssetReportingService. */
class SettleFormSubmissionRatesMessageMediaAssetReporting implements SettleFormSubmissionRatesMessageTarget {
  private readonly client: mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormSubmissionRatesMessageRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest, mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportResponse>(
      (request, done) => this.client.generateMediaAssetReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetReportingServiceApi.GenerateMediaAssetReportRequest.fromPartial({ details: { cron: record.message, format: record.correlationId }, reason: record.formSubmissionId })));
  }
}

/** Writes records to acme.ratelimiting.v1.RateLimitService. */
class SettleFormSubmissionRatesMessageRateLimit implements SettleFormSubmissionRatesMessageTarget {
  private readonly client: ratelimitingRateLimitServiceApi.RateLimitServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ratelimitingRateLimitServiceApi.RateLimitServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormSubmissionRatesMessageRecord): Promise<void> {
    await call<ratelimitingRateLimitServiceApi.CloneRateLimitRequest, ratelimitingRateLimitServiceApi.CloneRateLimitResponse>(
      (request, done) => this.client.cloneRateLimit(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      ratelimitingRateLimitServiceApi.CloneRateLimitRequest.fromPartial({ requestId: record.formSubmissionId }));
  }
}

/** Writes records to acme.media.v1.MediaAssetSyncService. */
class SettleFormSubmissionRatesMessageMediaAssetSync implements SettleFormSubmissionRatesMessageTarget {
  private readonly client: mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormSubmissionRatesMessageRecord): Promise<void> {
    await call<mediaMediaAssetSyncServiceApi.PullMediaAssetsRequest, mediaMediaAssetSyncServiceApi.PullMediaAssetsResponse>(
      (request, done) => this.client.pullMediaAssets(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      mediaMediaAssetSyncServiceApi.PullMediaAssetsRequest.fromPartial({ reason: record.message, details: { cursor: record.correlationId } }));
  }
}

/** Writes records to acme.driverapp.v1.DriverHomeQueryService. */
class SettleFormSubmissionRatesMessageDriverHomeQuery implements SettleFormSubmissionRatesMessageTarget {
  private readonly client: driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleFormSubmissionRatesMessageRecord): Promise<void> {
    await call<driverappDriverHomeQueryServiceApi.LookupDriverHomeRequest, driverappDriverHomeQueryServiceApi.LookupDriverHomeResponse>(
      (request, done) => this.client.lookupDriverHome(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      driverappDriverHomeQueryServiceApi.LookupDriverHomeRequest.fromPartial({ driverHomeId: record.correlationId }));
  }
}

/** Runs the action registered for kind. */
async function actOnSettleFormSubmissionRatesMessage(kind: string, record: SettleFormSubmissionRatesMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "media-asset-reporting": () => new SettleFormSubmissionRatesMessageMediaAssetReporting(runtime).forward(record),
    "rate-limit": () => new SettleFormSubmissionRatesMessageRateLimit(runtime).forward(record),
    "media-asset-sync": () => new SettleFormSubmissionRatesMessageMediaAssetSync(runtime).forward(record),
    "driver-home-query": () => new SettleFormSubmissionRatesMessageDriverHomeQuery(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.forms.v1.FormSubmissionCalculationService/GetFormSubmissionRates and hands what it keeps to the
 * sink of its kind.
 */
export async function settleFormSubmissionRatesMessage(runtime: Runtime): Promise<void> {
  const upstream = new formsFormSubmissionCalculationServiceApi.FormSubmissionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest, formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesResponse>(
    (request, done) => upstream.getFormSubmissionRates(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    formsFormSubmissionCalculationServiceApi.GetFormSubmissionRatesRequest.fromPartial({ formSubmissionId: "nightly-settle-form-submission-rates-message" })));
  const record: SettleFormSubmissionRatesMessageRecord = {
    message: text.normalize(current.result?.message ?? ""),
    formSubmissionId: current.formSubmission?.formSubmissionId ?? "",
    source: text.normalize(current.formSubmission?.source ?? ""),
    correlationId: text.normalize(current.result?.correlationId ?? ""),
  };
  await actOnSettleFormSubmissionRatesMessage("rate-limit", record, runtime);
}
