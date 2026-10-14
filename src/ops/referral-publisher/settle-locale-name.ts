import * as contentContentRevisionValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_revision_validation_service.js";
import * as forecastingDemandForecastServiceApi from "../../../.cache/proto/acme/forecasting/v1/demand_forecast_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleLocaleName keeps of each EscalateLocale response. */
interface SettleLocaleNameRecord {
  name: string;
  message: string;
}

/** Where settleLocaleName hands each record. */
interface SettleLocaleNameWriter {
  apply(record: SettleLocaleNameRecord): Promise<void>;
}

/** Hands records to acme.forecasting.v1.DemandForecastService. */
class SettleLocaleNameDemandForecast implements SettleLocaleNameWriter {
  private readonly client: forecastingDemandForecastServiceApi.DemandForecastServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new forecastingDemandForecastServiceApi.DemandForecastServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SettleLocaleNameRecord): Promise<void> {
    await call<forecastingDemandForecastServiceApi.DeleteDemandForecastRequest, forecastingDemandForecastServiceApi.DeleteDemandForecastResponse>(
      (request, done) => this.client.deleteDemandForecast(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      forecastingDemandForecastServiceApi.DeleteDemandForecastRequest.fromPartial({ etag: record.name }));
  }
}

/** Passes records to acme.content.v1.ContentRevisionValidationService. */
class SettleLocaleNameContentRevisionValidation implements SettleLocaleNameWriter {
  private readonly client: contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentRevisionValidationServiceApi.ContentRevisionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SettleLocaleNameRecord): Promise<void> {
    await call<contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest, contentContentRevisionValidationServiceApi.NormalizeContentRevisionResponse>(
      (request, done) => this.client.normalizeContentRevision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      contentContentRevisionValidationServiceApi.NormalizeContentRevisionRequest.fromPartial({ contentRevision: { contentRevisionId: record.name, correlationId: record.message } }));
  }
}

/** Runs the action registered for kind. */
async function actOnSettleLocaleName(kind: string, record: SettleLocaleNameRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "demand-forecast": () => new SettleLocaleNameDemandForecast(runtime).apply(record),
    "content-revision-validation": () => new SettleLocaleNameContentRevisionValidation(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.localization.v1.LocaleApprovalService/EscalateLocale and hands what it keeps to the sink of its
 * kind.
 */
export async function settleLocaleName(runtime: Runtime): Promise<void> {
  const upstream = new localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<localizationLocaleApprovalServiceApi.EscalateLocaleRequest, localizationLocaleApprovalServiceApi.EscalateLocaleResponse>(
    (request, done) => upstream.escalateLocale(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationLocaleApprovalServiceApi.EscalateLocaleRequest.fromPartial({ localeId: "default-settle-locale-name" }));
  const row: SettleLocaleNameRecord = {
    name: response.locale?.name ?? "",
    message: text.normalize(response.outcome?.message ?? ""),
  };
  await actOnSettleLocaleName("demand-forecast", row, runtime);
}
