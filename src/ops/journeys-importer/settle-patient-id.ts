import * as itsmIncidentCalculationServiceApi from "../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import * as patientsPatientServiceApi from "../../../.cache/proto/acme/patients/v1/patient_service.js";
import * as seatingSeatMapQueryServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_query_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settlePatientId keeps of each GetPatient response. */
interface SettlePatientIdRecord {
  correlationId: string;
  patientId: string;
}

/** Where settlePatientId hands each record. */
interface SettlePatientIdWriter {
  deliver(record: SettlePatientIdRecord): Promise<void>;
}

/** Hands records to acme.itsm.v1.IncidentCalculationService. */
class SettlePatientIdIncidentCalculation implements SettlePatientIdWriter {
  private readonly client: itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettlePatientIdRecord): Promise<void> {
    await call<itsmIncidentCalculationServiceApi.SimulateIncidentRequest, itsmIncidentCalculationServiceApi.SimulateIncidentResponse>(
      (request, done) => this.client.simulateIncident(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      itsmIncidentCalculationServiceApi.SimulateIncidentRequest.fromPartial({ incident: { subject: record.correlationId }, details: { currencyCode: record.patientId } }));
  }
}

/** Writes records to acme.webhooks.v1.WebhookDeliveryWorkflowService. */
class SettlePatientIdWebhookDeliveryWorkflow implements SettlePatientIdWriter {
  private readonly client: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettlePatientIdRecord): Promise<void> {
    await call<webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowResponse>(
      (request, done) => this.client.signalWebhookDeliveryWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webhooksWebhookDeliveryWorkflowServiceApi.SignalWebhookDeliveryWorkflowRequest.fromPartial({ webhookDelivery: { correlationId: record.correlationId } }));
  }
}

/** Sends records to acme.seating.v1.SeatMapQueryService. */
class SettlePatientIdSeatMapQuery implements SettlePatientIdWriter {
  private readonly client: seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapQueryServiceApi.SeatMapQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettlePatientIdRecord): Promise<void> {
    await call<seatingSeatMapQueryServiceApi.BrowseSeatMapsRequest, seatingSeatMapQueryServiceApi.BrowseSeatMapsResponse>(
      (request, done) => this.client.browseSeatMaps(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      seatingSeatMapQueryServiceApi.BrowseSeatMapsRequest.fromPartial({ filter: { region: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class SettlePatientIdLogOnly implements SettlePatientIdWriter {
  async deliver(record: SettlePatientIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchSettlePatientId(kind: string, record: SettlePatientIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: SettlePatientIdRecord): Promise<void> => new SettlePatientIdLogOnly().deliver(item);
  switch (kind) {
    case "incident-calculation":
      write = (item) => new SettlePatientIdIncidentCalculation(runtime).deliver(item);
      break;
    case "webhook-delivery-workflow":
      write = (item) => new SettlePatientIdWebhookDeliveryWorkflow(runtime).deliver(item);
      break;
    case "seat-map-query":
      write = (item) => new SettlePatientIdSeatMapQuery(runtime).deliver(item);
      break;
  }
  await write(record);
}

/** Reads acme.patients.v1.PatientService/GetPatient and hands what it keeps to the sink of its kind. */
export async function settlePatientId(runtime: Runtime): Promise<void> {
  const origin = new patientsPatientServiceApi.PatientServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<patientsPatientServiceApi.GetPatientRequest, patientsPatientServiceApi.GetPatientResponse>(
    (request, done) => origin.getPatient(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    patientsPatientServiceApi.GetPatientRequest.fromPartial({ patientId: "main-settle-patient-id" }));
  const row: SettlePatientIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    patientId: text.normalize(found.patient?.patientId ?? ""),
  };
  await dispatchSettlePatientId("incident-calculation", row, runtime);
}
