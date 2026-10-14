import * as mediaMediaAssetServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as ratelimitingRateLimitCalculationServiceApi from "../../../.cache/proto/acme/ratelimiting/v1/rate_limit_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffMediaAssetCode keeps of each CreateMediaAsset response. */
interface HandOffMediaAssetCodeRecord {
  code: string;
  name: string;
  correlationId: string;
  mediaAssetId: string;
}

/** Where handOffMediaAssetCode hands each record. */
interface HandOffMediaAssetCodeSink {
  push(record: HandOffMediaAssetCodeRecord): Promise<void>;
}

/** Hands records to acme.ratelimiting.v1.RateLimitCalculationService. */
class HandOffMediaAssetCodeRateLimitCalculation implements HandOffMediaAssetCodeSink {
  private readonly client: ratelimitingRateLimitCalculationServiceApi.RateLimitCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ratelimitingRateLimitCalculationServiceApi.RateLimitCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffMediaAssetCodeRecord): Promise<void> {
    await retry(() => call<ratelimitingRateLimitCalculationServiceApi.CalculateRateLimitRequest, ratelimitingRateLimitCalculationServiceApi.CalculateRateLimitResponse>(
      (request, done) => this.client.calculateRateLimit(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      ratelimitingRateLimitCalculationServiceApi.CalculateRateLimitRequest.fromPartial({ rateLimitId: record.correlationId, rateLimit: { rateLimitId: record.name } })));
  }
}

/**
 * Reads acme.media.v1.MediaAssetService/CreateMediaAsset and hands what it keeps to
 * acme.ratelimiting.v1.RateLimitCalculationService.
 */
export async function handOffMediaAssetCode(runtime: Runtime): Promise<void> {
  const origin = new mediaMediaAssetServiceApi.MediaAssetServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaMediaAssetServiceApi.CreateMediaAssetRequest, mediaMediaAssetServiceApi.CreateMediaAssetResponse>(
    (request, done) => origin.createMediaAsset(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaMediaAssetServiceApi.CreateMediaAssetRequest.fromPartial({ requestId: "current-hand-off-media-asset-code" }));
  const kept: HandOffMediaAssetCodeRecord = {
    code: reply.mediaAsset?.code ?? "",
    name: reply.mediaAsset?.name ?? "",
    correlationId: reply.result?.correlationId ?? "",
    mediaAssetId: text.normalize(reply.mediaAsset?.mediaAssetId ?? ""),
  };
  await new HandOffMediaAssetCodeRateLimitCalculation(runtime).push(kept);
}
