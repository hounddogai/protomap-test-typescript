import * as identityUserValidationServiceApi from "../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as performersPerformerQueryServiceApi from "../../../.cache/proto/acme/performers/v1/performer_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleUserDecisionStatus keeps of each ExplainUserDecision response. */
interface SettleUserDecisionStatusRecord {
  status: string;
  correlationId: string;
  userId: string;
  message: string;
}

/** Where settleUserDecisionStatus hands each record. */
interface SettleUserDecisionStatusSink {
  push(record: SettleUserDecisionStatusRecord): Promise<void>;
}

/** Writes records to acme.performers.v1.PerformerQueryService. */
class SettleUserDecisionStatusPerformerQuery implements SettleUserDecisionStatusSink {
  private readonly client: performersPerformerQueryServiceApi.PerformerQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new performersPerformerQueryServiceApi.PerformerQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleUserDecisionStatusRecord): Promise<void> {
    await call<performersPerformerQueryServiceApi.SuggestPerformersRequest, performersPerformerQueryServiceApi.SuggestPerformersResponse>(
      (request, done) => this.client.suggestPerformers(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      performersPerformerQueryServiceApi.SuggestPerformersRequest.fromPartial({ filter: { region: record.correlationId } }));
  }
}

/** Sends records to acme.media.v1.RenditionCalculationService. */
class SettleUserDecisionStatusRenditionCalculation implements SettleUserDecisionStatusSink {
  private readonly client: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleUserDecisionStatusRecord): Promise<void> {
    await retry(() => call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>(
      (request, done) => this.client.recalculateRenditions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest.fromPartial({ renditionId: record.status, rendition: { name: record.correlationId } })));
  }
}

/**
 * Reads acme.identity.v1.UserValidationService/ExplainUserDecision and hands what it keeps to the sink of its
 * kind.
 */
export async function settleUserDecisionStatus(runtime: Runtime): Promise<void> {
  const source = new identityUserValidationServiceApi.UserValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<identityUserValidationServiceApi.ExplainUserDecisionRequest, identityUserValidationServiceApi.ExplainUserDecisionResponse>(
    (request, done) => source.explainUserDecision(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    identityUserValidationServiceApi.ExplainUserDecisionRequest.fromPartial({ userId: "nightly-settle-user-decision-status" })));
  const record: SettleUserDecisionStatusRecord = {
    status: found.outcome?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
    userId: found.user?.userId ?? "",
    message: found.outcome?.message ?? "",
  };
  const sinks: SettleUserDecisionStatusSink[] = [
    new SettleUserDecisionStatusPerformerQuery(runtime),
    new SettleUserDecisionStatusRenditionCalculation(runtime),
  ];
  await sinks[1]!.push(record);
}
