import * as fuelFuelCardCalculationServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_calculation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as travelTripQueryServiceApi from "../../../.cache/proto/acme/travel/v1/trip_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardTripsToken keeps of each FindTrips response. */
interface ForwardTripsTokenRecord {
  nextPageToken: string;
  correlationId: string;
}

/** Where forwardTripsToken hands each record. */
interface ForwardTripsTokenWriter {
  push(record: ForwardTripsTokenRecord): Promise<void>;
}

/** Passes records to acme.fuel.v1.FuelCardCalculationService. */
class ForwardTripsTokenFuelCardCalculation implements ForwardTripsTokenWriter {
  private readonly client: fuelFuelCardCalculationServiceApi.FuelCardCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fuelFuelCardCalculationServiceApi.FuelCardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardTripsTokenRecord): Promise<void> {
    await call<fuelFuelCardCalculationServiceApi.ExplainFuelCardCalculationRequest, fuelFuelCardCalculationServiceApi.ExplainFuelCardCalculationResponse>(
      (request, done) => this.client.explainFuelCardCalculation(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fuelFuelCardCalculationServiceApi.ExplainFuelCardCalculationRequest.fromPartial({ fuelCard: { currencyCode: record.correlationId }, details: { locale: record.nextPageToken } }));
  }
}

/** Sends records to acme.notifications.v1.DeliveryAttemptWorkflowService. */
class ForwardTripsTokenDeliveryAttemptWorkflow implements ForwardTripsTokenWriter {
  private readonly client: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ForwardTripsTokenRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>(
      (request, done) => this.client.advanceDeliveryAttemptWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest.fromPartial({ reason: record.correlationId })));
  }
}

/** Reads acme.travel.v1.TripQueryService/FindTrips and hands what it keeps to the sink of its kind. */
export async function forwardTripsToken(runtime: Runtime): Promise<void> {
  const source = new travelTripQueryServiceApi.TripQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<travelTripQueryServiceApi.FindTripsRequest, travelTripQueryServiceApi.FindTripsResponse>(
    (request, done) => source.findTrips(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    travelTripQueryServiceApi.FindTripsRequest.fromPartial({ orderBy: "nightly-forward-trips-token" }));
  const record: ForwardTripsTokenRecord = {
    nextPageToken: text.normalize(reply.pageInfo?.nextPageToken ?? ""),
    correlationId: reply.result?.correlationId ?? "",
  };
  const sinks: ForwardTripsTokenWriter[] = [
    new ForwardTripsTokenFuelCardCalculation(runtime),
    new ForwardTripsTokenDeliveryAttemptWorkflow(runtime),
  ];
  for (const sink of sinks) {
    await sink.push(record);
  }
}
