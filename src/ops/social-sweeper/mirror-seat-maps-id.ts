import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as seatingSeatMapCalculationServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorSeatMapsId keeps of each RecalculateSeatMaps response. */
interface MirrorSeatMapsIdRecord {
  seatMapId: string;
  parentId: string;
}

/** Where mirrorSeatMapsId hands each record. */
interface MirrorSeatMapsIdDestination {
  deliver(record: MirrorSeatMapsIdRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.DeliveryAttemptValidationService. */
class MirrorSeatMapsIdDeliveryAttemptValidation implements MirrorSeatMapsIdDestination {
  private readonly client: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorSeatMapsIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>(
      (request, done) => this.client.explainDeliveryAttemptDecision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest.fromPartial({ deliveryAttemptId: record.parentId, deliveryAttempt: { correlationId: record.seatMapId } }));
  }
}

/**
 * Reads acme.seating.v1.SeatMapCalculationService/RecalculateSeatMaps and hands what it keeps to
 * acme.notifications.v1.DeliveryAttemptValidationService.
 */
export async function mirrorSeatMapsId(runtime: Runtime): Promise<void> {
  const origin = new seatingSeatMapCalculationServiceApi.SeatMapCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<seatingSeatMapCalculationServiceApi.RecalculateSeatMapsRequest, seatingSeatMapCalculationServiceApi.RecalculateSeatMapsResponse>(
    (request, done) => origin.recalculateSeatMaps(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    seatingSeatMapCalculationServiceApi.RecalculateSeatMapsRequest.fromPartial({ seatMapId: "nightly-mirror-seat-maps-id" })));
  const kept: MirrorSeatMapsIdRecord = {
    seatMapId: reply.seatMap?.seatMapId ?? "",
    parentId: text.normalize(reply.seatMap?.parentId ?? ""),
  };
  await new MirrorSeatMapsIdDeliveryAttemptValidation(runtime).deliver(kept);
}
