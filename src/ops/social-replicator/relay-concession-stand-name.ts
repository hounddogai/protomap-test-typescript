import * as concessionsConcessionStandQueryServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_query_service.js";
import * as ordersOrderServiceApi from "../../../.cache/proto/acme/orders/v1/order_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as schedulingShiftServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_service.js";
import * as telematicsTelemetryReadingCalculationServiceApi from "../../../.cache/proto/acme/telematics/v1/telemetry_reading_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayConcessionStandName keeps of each PeekConcessionStand response. */
interface RelayConcessionStandNameRecord {
  name: string;
  message: string;
}

/** Where relayConcessionStandName hands each record. */
interface RelayConcessionStandNameTarget {
  forward(record: RelayConcessionStandNameRecord): Promise<void>;
}

/** Passes records to acme.scheduling.v1.ShiftService. */
class RelayConcessionStandNameShift implements RelayConcessionStandNameTarget {
  private readonly client: schedulingShiftServiceApi.ShiftServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new schedulingShiftServiceApi.ShiftServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayConcessionStandNameRecord): Promise<void> {
    await retry(() => call<schedulingShiftServiceApi.DeleteShiftRequest, schedulingShiftServiceApi.DeleteShiftResponse>(
      (request, done) => this.client.deleteShift(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      schedulingShiftServiceApi.DeleteShiftRequest.fromPartial({ shiftId: record.name, etag: record.message })));
  }
}

/** Hands records to acme.orders.v1.OrderService. */
class RelayConcessionStandNameOrder implements RelayConcessionStandNameTarget {
  private readonly client: ordersOrderServiceApi.OrderServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ordersOrderServiceApi.OrderServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayConcessionStandNameRecord): Promise<void> {
    await retry(() => call<ordersOrderServiceApi.CreateOrderRequest, ordersOrderServiceApi.CreateOrderResponse>(
      (request, done) => this.client.createOrder(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      ordersOrderServiceApi.CreateOrderRequest.fromPartial({ order: { notes: record.name } })));
  }
}

/** Writes records to acme.personalization.v1.AffinityValidationService. */
class RelayConcessionStandNameAffinityValidation implements RelayConcessionStandNameTarget {
  private readonly client: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityValidationServiceApi.AffinityValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayConcessionStandNameRecord): Promise<void> {
    await call<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>(
      (request, done) => this.client.explainAffinityDecision(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest.fromPartial({ affinity: { correlationId: record.message }, details: { locale: record.name } }));
  }
}

/** Sends records to acme.telematics.v1.TelemetryReadingCalculationService. */
class RelayConcessionStandNameTelemetryReadingCalculation implements RelayConcessionStandNameTarget {
  private readonly client: telematicsTelemetryReadingCalculationServiceApi.TelemetryReadingCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new telematicsTelemetryReadingCalculationServiceApi.TelemetryReadingCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayConcessionStandNameRecord): Promise<void> {
    await retry(() => call<telematicsTelemetryReadingCalculationServiceApi.EstimateTelemetryReadingRequest, telematicsTelemetryReadingCalculationServiceApi.EstimateTelemetryReadingResponse>(
      (request, done) => this.client.estimateTelemetryReading(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      telematicsTelemetryReadingCalculationServiceApi.EstimateTelemetryReadingRequest.fromPartial({ telemetryReading: { correlationId: record.message } })));
  }
}

/**
 * Reads acme.concessions.v1.ConcessionStandQueryService/PeekConcessionStand and hands what it keeps to the
 * sink of its kind.
 */
export async function relayConcessionStandName(runtime: Runtime): Promise<void> {
  const origin = new concessionsConcessionStandQueryServiceApi.ConcessionStandQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<concessionsConcessionStandQueryServiceApi.PeekConcessionStandRequest, concessionsConcessionStandQueryServiceApi.PeekConcessionStandResponse>(
    (request, done) => origin.peekConcessionStand(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    concessionsConcessionStandQueryServiceApi.PeekConcessionStandRequest.fromPartial({ concessionStandId: "primary-relay-concession-stand-name" })));
  const record: RelayConcessionStandNameRecord = {
    name: text.normalize(reply.concessionStand?.name ?? ""),
    message: text.normalize(reply.result?.message ?? ""),
  };
  const entries: Array<{ kind: string; sink: RelayConcessionStandNameTarget }> = [
    { kind: "shift", sink: new RelayConcessionStandNameShift(runtime) },
    { kind: "order", sink: new RelayConcessionStandNameOrder(runtime) },
    { kind: "affinity-validation", sink: new RelayConcessionStandNameAffinityValidation(runtime) },
    { kind: "telemetry-reading-calculation", sink: new RelayConcessionStandNameTelemetryReadingCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "telemetry-reading-calculation") continue;
    await entry.sink.forward(record);
  }
}
