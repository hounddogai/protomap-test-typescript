import * as appointmentsAppointmentServiceApi from "../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as sellersSellerCalculationServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_calculation_service.js";
import * as toursTourQueryServiceApi from "../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replaySellerStatus keeps of each CalculateSeller response. */
interface ReplaySellerStatusRecord {
  status: string;
  correlationId: string;
}

/** Where replaySellerStatus hands each record. */
interface ReplaySellerStatusWriter {
  forward(record: ReplaySellerStatusRecord): Promise<void>;
}

/** Sends records to acme.appointments.v1.AppointmentService. */
class ReplaySellerStatusAppointment implements ReplaySellerStatusWriter {
  private readonly client: appointmentsAppointmentServiceApi.AppointmentServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new appointmentsAppointmentServiceApi.AppointmentServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplaySellerStatusRecord): Promise<void> {
    await call<appointmentsAppointmentServiceApi.CreateAppointmentRequest, appointmentsAppointmentServiceApi.CreateAppointmentResponse>(
      (request, done) => this.client.createAppointment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      appointmentsAppointmentServiceApi.CreateAppointmentRequest.fromPartial({ appointment: { appointmentId: record.status }, requestId: record.correlationId }));
  }
}

/** Hands records to acme.notifications.v1.DeliveryAttemptWorkflowService. */
class ReplaySellerStatusDeliveryAttemptWorkflow implements ReplaySellerStatusWriter {
  private readonly client: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplaySellerStatusRecord): Promise<void> {
    await call<notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowResponse>(
      (request, done) => this.client.advanceDeliveryAttemptWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptWorkflowServiceApi.AdvanceDeliveryAttemptWorkflowRequest.fromPartial({ details: { initiatedBy: record.status }, deliveryAttempt: { kind: record.correlationId } }));
  }
}

/** Sends records to acme.tours.v1.TourQueryService. */
class ReplaySellerStatusTourQuery implements ReplaySellerStatusWriter {
  private readonly client: toursTourQueryServiceApi.TourQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new toursTourQueryServiceApi.TourQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ReplaySellerStatusRecord): Promise<void> {
    await call<toursTourQueryServiceApi.LookupTourRequest, toursTourQueryServiceApi.LookupTourResponse>(
      (request, done) => this.client.lookupTour(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      toursTourQueryServiceApi.LookupTourRequest.fromPartial({ tourId: record.status }));
  }
}

/**
 * Reads acme.sellers.v1.SellerCalculationService/CalculateSeller and hands what it keeps to the sink of its
 * kind.
 */
export async function replaySellerStatus(runtime: Runtime): Promise<void> {
  const reader = new sellersSellerCalculationServiceApi.SellerCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<sellersSellerCalculationServiceApi.CalculateSellerRequest, sellersSellerCalculationServiceApi.CalculateSellerResponse>(
    (request, done) => reader.calculateSeller(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    sellersSellerCalculationServiceApi.CalculateSellerRequest.fromPartial({ sellerId: "current-replay-seller-status" }));
  const record: ReplaySellerStatusRecord = {
    status: text.normalize(response.result?.status ?? ""),
    correlationId: response.result?.correlationId ?? "",
  };
  const sinks: ReplaySellerStatusWriter[] = [
    new ReplaySellerStatusAppointment(runtime),
    new ReplaySellerStatusDeliveryAttemptWorkflow(runtime),
    new ReplaySellerStatusTourQuery(runtime),
  ];
  await sinks[2]!.forward(record);
}
