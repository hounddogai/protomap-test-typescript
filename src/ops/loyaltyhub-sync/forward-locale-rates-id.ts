import * as localizationLocaleCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as messagingConversationCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as surveysQuestionWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/question_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardLocaleRatesId keeps of each GetLocaleRates response. */
interface ForwardLocaleRatesIdRecord {
  localeId: string;
  status: string;
  message: string;
}

/** Where forwardLocaleRatesId hands each record. */
interface ForwardLocaleRatesIdSink {
  apply(record: ForwardLocaleRatesIdRecord): Promise<void>;
}

/** Hands records to acme.messaging.v1.ConversationCalculationService. */
class ForwardLocaleRatesIdConversationCalculation implements ForwardLocaleRatesIdSink {
  private readonly client: messagingConversationCalculationServiceApi.ConversationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationCalculationServiceApi.ConversationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ForwardLocaleRatesIdRecord): Promise<void> {
    await retry(() => call<messagingConversationCalculationServiceApi.GetConversationRatesRequest, messagingConversationCalculationServiceApi.GetConversationRatesResponse>(
      (request, done) => this.client.getConversationRates(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingConversationCalculationServiceApi.GetConversationRatesRequest.fromPartial({ conversationId: record.status })));
  }
}

/** Hands records to acme.patientapp.v1.PatientHomeService. */
class ForwardLocaleRatesIdPatientHome implements ForwardLocaleRatesIdSink {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ForwardLocaleRatesIdRecord): Promise<void> {
    await call<patientappPatientHomeServiceApi.DeletePatientHomeRequest, patientappPatientHomeServiceApi.DeletePatientHomeResponse>(
      (request, done) => this.client.deletePatientHome(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      patientappPatientHomeServiceApi.DeletePatientHomeRequest.fromPartial({ reason: record.status, etag: record.localeId, patientHomeId: record.message }));
  }
}

/** Passes records to acme.surveys.v1.QuestionWorkflowService. */
class ForwardLocaleRatesIdQuestionWorkflow implements ForwardLocaleRatesIdSink {
  private readonly client: surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionWorkflowServiceApi.QuestionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ForwardLocaleRatesIdRecord): Promise<void> {
    await retry(() => call<surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest, surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowResponse>(
      (request, done) => this.client.inspectQuestionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysQuestionWorkflowServiceApi.InspectQuestionWorkflowRequest.fromPartial({ questionId: record.status })));
  }
}

/**
 * Reads acme.localization.v1.LocaleCalculationService/GetLocaleRates and hands what it keeps to the sink of
 * its kind.
 */
export async function forwardLocaleRatesId(runtime: Runtime): Promise<void> {
  const origin = new localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<localizationLocaleCalculationServiceApi.GetLocaleRatesRequest, localizationLocaleCalculationServiceApi.GetLocaleRatesResponse>(
    (request, done) => origin.getLocaleRates(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationLocaleCalculationServiceApi.GetLocaleRatesRequest.fromPartial({ localeId: "nightly-forward-locale-rates-id" }));
  const record: ForwardLocaleRatesIdRecord = {
    localeId: response.locale?.localeId ?? "",
    status: response.result?.status ?? "",
    message: response.result?.message ?? "",
  };
  const sinks = new Map<string, ForwardLocaleRatesIdSink>();
  sinks.set("conversation-calculation", new ForwardLocaleRatesIdConversationCalculation(runtime));
  sinks.set("patient-home", new ForwardLocaleRatesIdPatientHome(runtime));
  sinks.set("question-workflow", new ForwardLocaleRatesIdQuestionWorkflow(runtime));
  await sinks.get("patient-home")!.apply(record);
}
