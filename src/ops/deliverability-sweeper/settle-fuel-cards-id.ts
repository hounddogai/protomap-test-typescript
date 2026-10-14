import * as chatChatRoomLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as experimentsExperimentServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as formsFormFieldWorkflowServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_workflow_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleFuelCardsId keeps of each FindFuelCards response. */
interface SettleFuelCardsIdRecord {
  correlationId: string;
  status: string;
  nextPageToken: string;
  message: string;
}

/** Where settleFuelCardsId hands each record. */
interface SettleFuelCardsIdWriter {
  deliver(record: SettleFuelCardsIdRecord): Promise<void>;
}

/** Hands records to acme.patientapp.v1.PatientHomeService. */
class SettleFuelCardsIdPatientHome implements SettleFuelCardsIdWriter {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettleFuelCardsIdRecord): Promise<void> {
    await retry(() => call<patientappPatientHomeServiceApi.ClonePatientHomeRequest, patientappPatientHomeServiceApi.ClonePatientHomeResponse>(
      (request, done) => this.client.clonePatientHome(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      patientappPatientHomeServiceApi.ClonePatientHomeRequest.fromPartial({ patientHome: { patientHomeId: record.status, subject: record.correlationId } })));
  }
}

/** Hands records to acme.forms.v1.FormFieldWorkflowService. */
class SettleFuelCardsIdFormFieldWorkflow implements SettleFuelCardsIdWriter {
  private readonly client: formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldWorkflowServiceApi.FormFieldWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettleFuelCardsIdRecord): Promise<void> {
    await retry(() => call<formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowRequest, formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowResponse>(
      (request, done) => this.client.retryFormFieldWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormFieldWorkflowServiceApi.RetryFormFieldWorkflowRequest.fromPartial({ formField: { name: record.nextPageToken } })));
  }
}

/** Writes records to acme.chat.v1.ChatRoomLifecycleService. */
class SettleFuelCardsIdChatRoomLifecycle implements SettleFuelCardsIdWriter {
  private readonly client: chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettleFuelCardsIdRecord): Promise<void> {
    await call<chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest, chatChatRoomLifecycleServiceApi.ReinstateChatRoomResponse>(
      (request, done) => this.client.reinstateChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatRoomLifecycleServiceApi.ReinstateChatRoomRequest.fromPartial({ details: { reasonCode: record.nextPageToken } }));
  }
}

/** Hands records to acme.experiments.v1.ExperimentService. */
class SettleFuelCardsIdExperiment implements SettleFuelCardsIdWriter {
  private readonly client: experimentsExperimentServiceApi.ExperimentServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentServiceApi.ExperimentServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SettleFuelCardsIdRecord): Promise<void> {
    await call<experimentsExperimentServiceApi.CreateExperimentRequest, experimentsExperimentServiceApi.CreateExperimentResponse>(
      (request, done) => this.client.createExperiment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentServiceApi.CreateExperimentRequest.fromPartial({ experiment: { title: record.correlationId, experimentId: record.nextPageToken } }));
  }
}

/** Reads acme.fuel.v1.FuelCardQueryService/FindFuelCards and hands what it keeps to the sink of its kind. */
export async function settleFuelCardsId(runtime: Runtime): Promise<void> {
  const source = new fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<fuelFuelCardQueryServiceApi.FindFuelCardsRequest, fuelFuelCardQueryServiceApi.FindFuelCardsResponse>(
    (request, done) => source.findFuelCards(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    fuelFuelCardQueryServiceApi.FindFuelCardsRequest.fromPartial({ orderBy: "main-settle-fuel-cards-id" }));
  const entry: SettleFuelCardsIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    status: text.normalize(found.result?.status ?? ""),
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
    message: found.result?.message ?? "",
  };
  const sinks = new Map<string, SettleFuelCardsIdWriter>();
  sinks.set("patient-home", new SettleFuelCardsIdPatientHome(runtime));
  sinks.set("form-field-workflow", new SettleFuelCardsIdFormFieldWorkflow(runtime));
  sinks.set("chat-room-lifecycle", new SettleFuelCardsIdChatRoomLifecycle(runtime));
  sinks.set("experiment", new SettleFuelCardsIdExperiment(runtime));
  await sinks.get("patient-home")!.deliver(entry);
}
