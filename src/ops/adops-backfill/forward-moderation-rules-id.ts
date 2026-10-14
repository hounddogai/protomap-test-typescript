import * as communityModerationValidationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardModerationRulesId keeps of each GetModerationRules response. */
interface ForwardModerationRulesIdRecord {
  correlationId: string;
  message: string;
  moderationId: string;
}

/** Where forwardModerationRulesId hands each record. */
interface ForwardModerationRulesIdTarget {
  forward(record: ForwardModerationRulesIdRecord): Promise<void>;
}

/** Hands records to acme.metrics.v1.MetricSeriesQueryService. */
class ForwardModerationRulesIdMetricSeriesQuery implements ForwardModerationRulesIdTarget {
  private readonly client: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardModerationRulesIdRecord): Promise<void> {
    await retry(() => call<metricsMetricSeriesQueryServiceApi.CountMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.CountMetricSeriesesResponse>(
      (request, done) => this.client.countMetricSerieses(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      metricsMetricSeriesQueryServiceApi.CountMetricSeriesesRequest.fromPartial({ filter: { ownerId: record.moderationId } })));
  }
}

/** Passes records to acme.keymanagement.v1.CryptoKeyCalculationService. */
class ForwardModerationRulesIdCryptoKeyCalculation implements ForwardModerationRulesIdTarget {
  private readonly client: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardModerationRulesIdRecord): Promise<void> {
    await call<keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyResponse>(
      (request, done) => this.client.simulateCryptoKey(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      keymanagementCryptoKeyCalculationServiceApi.SimulateCryptoKeyRequest.fromPartial({ cryptoKeyId: record.moderationId, details: { currencyCode: record.correlationId }, reason: record.message }));
  }
}

/** Runs the action registered for kind. */
async function actOnForwardModerationRulesId(kind: string, record: ForwardModerationRulesIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "metric-series-query": () => new ForwardModerationRulesIdMetricSeriesQuery(runtime).forward(record),
    "crypto-key-calculation": () => new ForwardModerationRulesIdCryptoKeyCalculation(runtime).forward(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.community.v1.ModerationValidationService/GetModerationRules and hands what it keeps to the sink
 * of its kind.
 */
export async function forwardModerationRulesId(runtime: Runtime): Promise<void> {
  const source = new communityModerationValidationServiceApi.ModerationValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<communityModerationValidationServiceApi.GetModerationRulesRequest, communityModerationValidationServiceApi.GetModerationRulesResponse>(
    (request, done) => source.getModerationRules(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    communityModerationValidationServiceApi.GetModerationRulesRequest.fromPartial({ moderationId: "default-forward-moderation-rules-id" })));
  const record: ForwardModerationRulesIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
    moderationId: text.normalize(reply.moderation?.moderationId ?? ""),
  };
  await actOnForwardModerationRulesId("metric-series-query", record, runtime);
}
