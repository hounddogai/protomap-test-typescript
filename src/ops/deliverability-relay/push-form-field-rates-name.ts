import * as chatChatRoomQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushFormFieldRatesName keeps of each GetFormFieldRates response. */
interface PushFormFieldRatesNameRecord {
  name: string;
  correlationId: string;
  description: string;
  message: string;
}

/** Where pushFormFieldRatesName hands each record. */
interface PushFormFieldRatesNameSink {
  apply(record: PushFormFieldRatesNameRecord): Promise<void>;
}

/** Hands records to acme.media.v1.TranscodeJobWorkflowService. */
class PushFormFieldRatesNameTranscodeJobWorkflow implements PushFormFieldRatesNameSink {
  private readonly client: mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushFormFieldRatesNameRecord): Promise<void> {
    await retry(() => call<mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowResponse>(
      (request, done) => this.client.resumeTranscodeJobWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobWorkflowServiceApi.ResumeTranscodeJobWorkflowRequest.fromPartial({ transcodeJobId: record.correlationId, details: { step: record.message } })));
  }
}

/** Writes records to acme.personalization.v1.AffinityCalculationService. */
class PushFormFieldRatesNameAffinityCalculation implements PushFormFieldRatesNameSink {
  private readonly client: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushFormFieldRatesNameRecord): Promise<void> {
    await call<personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationRequest, personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationResponse>(
      (request, done) => this.client.explainAffinityCalculation(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationAffinityCalculationServiceApi.ExplainAffinityCalculationRequest.fromPartial({ affinity: { correlationId: record.correlationId } }));
  }
}

/** Sends records to acme.chat.v1.ChatRoomQueryService. */
class PushFormFieldRatesNameChatRoomQuery implements PushFormFieldRatesNameSink {
  private readonly client: chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomQueryServiceApi.ChatRoomQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushFormFieldRatesNameRecord): Promise<void> {
    await call<chatChatRoomQueryServiceApi.SuggestChatRoomsRequest, chatChatRoomQueryServiceApi.SuggestChatRoomsResponse>(
      (request, done) => this.client.suggestChatRooms(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatRoomQueryServiceApi.SuggestChatRoomsRequest.fromPartial({ page: { pageToken: record.correlationId }, filter: { region: record.message } }));
  }
}

/** Hands records to acme.experiments.v1.VariantCalculationService. */
class PushFormFieldRatesNameVariantCalculation implements PushFormFieldRatesNameSink {
  private readonly client: experimentsVariantCalculationServiceApi.VariantCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantCalculationServiceApi.VariantCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushFormFieldRatesNameRecord): Promise<void> {
    await call<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>(
      (request, done) => this.client.calculateVariant(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsVariantCalculationServiceApi.CalculateVariantRequest.fromPartial({ variantId: record.description }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushFormFieldRatesNameLogOnly implements PushFormFieldRatesNameSink {
  async apply(record: PushFormFieldRatesNameRecord): Promise<void> {
    console.info("no sink for record", record.name);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchPushFormFieldRatesName(kind: string, record: PushFormFieldRatesNameRecord, runtime: Runtime): Promise<void> {
  let write = (item: PushFormFieldRatesNameRecord): Promise<void> => new PushFormFieldRatesNameLogOnly().apply(item);
  switch (kind) {
    case "transcode-job-workflow":
      write = (item) => new PushFormFieldRatesNameTranscodeJobWorkflow(runtime).apply(item);
      break;
    case "affinity-calculation":
      write = (item) => new PushFormFieldRatesNameAffinityCalculation(runtime).apply(item);
      break;
    case "chat-room-query":
      write = (item) => new PushFormFieldRatesNameChatRoomQuery(runtime).apply(item);
      break;
    case "variant-calculation":
      write = (item) => new PushFormFieldRatesNameVariantCalculation(runtime).apply(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.forms.v1.FormFieldCalculationService/GetFormFieldRates and hands what it keeps to the sink of
 * its kind.
 */
export async function pushFormFieldRatesName(runtime: Runtime): Promise<void> {
  const source = new formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest, formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse>(
    (request, done) => source.getFormFieldRates(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest.fromPartial({ formFieldId: "main-push-form-field-rates-name" }));
  const record: PushFormFieldRatesNameRecord = {
    name: found.formField?.name ?? "",
    correlationId: found.result?.correlationId ?? "",
    description: text.normalize(found.formField?.description ?? ""),
    message: text.normalize(found.result?.message ?? ""),
  };
  await dispatchPushFormFieldRatesName("chat-room-query", record, runtime);
}
