import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as dispatchDispatchOrderServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_service.js";
import * as experimentsExposureValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as identitySessionValidationServiceApi from "../../../.cache/proto/acme/identity/v1/session_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeExposureDecisionMessage keeps of each ExplainExposureDecision response. */
interface RouteExposureDecisionMessageRecord {
  message: string;
  correlationId: string;
  exposureCorrelationId: string;
  kind: string;
}

/** Where routeExposureDecisionMessage hands each record. */
interface RouteExposureDecisionMessageWriter {
  apply(record: RouteExposureDecisionMessageRecord): Promise<void>;
}

/** Writes records to acme.identity.v1.SessionValidationService. */
class RouteExposureDecisionMessageSessionValidation implements RouteExposureDecisionMessageWriter {
  private readonly client: identitySessionValidationServiceApi.SessionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new identitySessionValidationServiceApi.SessionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RouteExposureDecisionMessageRecord): Promise<void> {
    await call<identitySessionValidationServiceApi.ScoreSessionRequest, identitySessionValidationServiceApi.ScoreSessionResponse>(
      (request, done) => this.client.scoreSession(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      identitySessionValidationServiceApi.ScoreSessionRequest.fromPartial({ session: { subject: record.exposureCorrelationId, sessionId: record.message } }));
  }
}

/** Sends records to acme.dispatch.v1.DispatchOrderService. */
class RouteExposureDecisionMessageDispatchOrder implements RouteExposureDecisionMessageWriter {
  private readonly client: dispatchDispatchOrderServiceApi.DispatchOrderServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderServiceApi.DispatchOrderServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RouteExposureDecisionMessageRecord): Promise<void> {
    await call<dispatchDispatchOrderServiceApi.GetDispatchOrderRequest, dispatchDispatchOrderServiceApi.GetDispatchOrderResponse>(
      (request, done) => this.client.getDispatchOrder(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      dispatchDispatchOrderServiceApi.GetDispatchOrderRequest.fromPartial({ dispatchOrderId: record.correlationId }));
  }
}

/** Sends records to acme.boxoffice.v1.BoxOfficeSaleQueryService. */
class RouteExposureDecisionMessageBoxOfficeSaleQuery implements RouteExposureDecisionMessageWriter {
  private readonly client: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: RouteExposureDecisionMessageRecord): Promise<void> {
    await call<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse>(
      (request, done) => this.client.suggestBoxOfficeSales(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest.fromPartial({ filter: { ownerId: record.message }, page: { pageToken: record.kind } }));
  }
}

/**
 * Reads acme.experiments.v1.ExposureValidationService/ExplainExposureDecision and hands what it keeps to the
 * sink of its kind.
 */
export async function routeExposureDecisionMessage(runtime: Runtime): Promise<void> {
  const origin = new experimentsExposureValidationServiceApi.ExposureValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse>(
    (request, done) => origin.explainExposureDecision(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({ exposureId: "main-route-exposure-decision-message" }));
  const row: RouteExposureDecisionMessageRecord = {
    message: reply.outcome?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
    exposureCorrelationId: reply.exposure?.correlationId ?? "",
    kind: reply.exposure?.kind ?? "",
  };
  const sinks: RouteExposureDecisionMessageWriter[] = [
    new RouteExposureDecisionMessageSessionValidation(runtime),
    new RouteExposureDecisionMessageDispatchOrder(runtime),
    new RouteExposureDecisionMessageBoxOfficeSaleQuery(runtime),
  ];
  await sinks[2]!.apply(row);
}
