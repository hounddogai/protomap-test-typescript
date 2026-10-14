import * as experimentsVariantValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as returnsReturnRequestQueryServiceApi from "../../../.cache/proto/acme/returns/v1/return_request_query_service.js";
import * as travelTripQueryServiceApi from "../../../.cache/proto/acme/travel/v1/trip_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncReturnRequestsId keeps of each ResolveReturnRequests response. */
interface SyncReturnRequestsIdRecord {
  correlationId: string;
  message: string;
  status: string;
  nextPageToken: string;
}

/** Where syncReturnRequestsId hands each record. */
interface SyncReturnRequestsIdDestination {
  apply(record: SyncReturnRequestsIdRecord): Promise<void>;
}

/** Passes records to acme.featureflags.v1.FeatureFlagService. */
class SyncReturnRequestsIdFeatureFlag implements SyncReturnRequestsIdDestination {
  private readonly client: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncReturnRequestsIdRecord): Promise<void> {
    await call<featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest, featureflagsFeatureFlagServiceApi.GetFeatureFlagResponse>(
      (request, done) => this.client.getFeatureFlag(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      featureflagsFeatureFlagServiceApi.GetFeatureFlagRequest.fromPartial({ featureFlagId: record.message }));
  }
}

/** Sends records to acme.travel.v1.TripQueryService. */
class SyncReturnRequestsIdTripQuery implements SyncReturnRequestsIdDestination {
  private readonly client: travelTripQueryServiceApi.TripQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new travelTripQueryServiceApi.TripQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncReturnRequestsIdRecord): Promise<void> {
    await call<travelTripQueryServiceApi.SummarizeTripsRequest, travelTripQueryServiceApi.SummarizeTripsResponse>(
      (request, done) => this.client.summarizeTrips(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      travelTripQueryServiceApi.SummarizeTripsRequest.fromPartial({ details: { cron: record.status, format: record.message } }));
  }
}

/** Passes records to acme.experiments.v1.VariantValidationService. */
class SyncReturnRequestsIdVariantValidation implements SyncReturnRequestsIdDestination {
  private readonly client: experimentsVariantValidationServiceApi.VariantValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantValidationServiceApi.VariantValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncReturnRequestsIdRecord): Promise<void> {
    await retry(() => call<experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest, experimentsVariantValidationServiceApi.ExplainVariantDecisionResponse>(
      (request, done) => this.client.explainVariantDecision(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsVariantValidationServiceApi.ExplainVariantDecisionRequest.fromPartial({ variant: { variantId: record.nextPageToken } })));
  }
}

/**
 * Reads acme.returns.v1.ReturnRequestQueryService/ResolveReturnRequests and hands what it keeps to the sink
 * of its kind.
 */
export async function syncReturnRequestsId(runtime: Runtime): Promise<void> {
  const origin = new returnsReturnRequestQueryServiceApi.ReturnRequestQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<returnsReturnRequestQueryServiceApi.ResolveReturnRequestsRequest, returnsReturnRequestQueryServiceApi.ResolveReturnRequestsResponse>(
    (request, done) => origin.resolveReturnRequests(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    returnsReturnRequestQueryServiceApi.ResolveReturnRequestsRequest.fromPartial({})));
  const entry: SyncReturnRequestsIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    message: text.normalize(found.result?.message ?? ""),
    status: text.normalize(found.result?.status ?? ""),
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  const registry: Record<string, SyncReturnRequestsIdDestination> = {};
  for (const entry of [
    { kind: "feature-flag", sink: new SyncReturnRequestsIdFeatureFlag(runtime) },
    { kind: "trip-query", sink: new SyncReturnRequestsIdTripQuery(runtime) },
    { kind: "variant-validation", sink: new SyncReturnRequestsIdVariantValidation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["feature-flag"]!.apply(entry);
}
