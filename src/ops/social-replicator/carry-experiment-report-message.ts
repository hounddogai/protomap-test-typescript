import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as formsFormValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as surveysQuestionValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import * as yardsYardQueryServiceApi from "../../../.cache/proto/acme/yards/v1/yard_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryExperimentReportMessage keeps of each FetchExperimentReport response. */
interface CarryExperimentReportMessageRecord {
  message: string;
  title: string;
  status: string;
  experimentId: string;
}

/** Where carryExperimentReportMessage hands each record. */
interface CarryExperimentReportMessageTarget {
  apply(record: CarryExperimentReportMessageRecord): Promise<void>;
}

/** Hands records to acme.forms.v1.FormValidationService. */
class CarryExperimentReportMessageFormValidation implements CarryExperimentReportMessageTarget {
  private readonly client: formsFormValidationServiceApi.FormValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormValidationServiceApi.FormValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryExperimentReportMessageRecord): Promise<void> {
    await retry(() => call<formsFormValidationServiceApi.LintFormsRequest, formsFormValidationServiceApi.LintFormsResponse>(
      (request, done) => this.client.lintForms(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      formsFormValidationServiceApi.LintFormsRequest.fromPartial({ form: { number: record.title }, reason: record.status })));
  }
}

/** Sends records to acme.surveys.v1.QuestionValidationService. */
class CarryExperimentReportMessageQuestionValidation implements CarryExperimentReportMessageTarget {
  private readonly client: surveysQuestionValidationServiceApi.QuestionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionValidationServiceApi.QuestionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryExperimentReportMessageRecord): Promise<void> {
    await call<surveysQuestionValidationServiceApi.ValidateQuestionRequest, surveysQuestionValidationServiceApi.ValidateQuestionResponse>(
      (request, done) => this.client.validateQuestion(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysQuestionValidationServiceApi.ValidateQuestionRequest.fromPartial({ details: { locale: record.experimentId }, question: { description: record.status }, questionId: record.title }));
  }
}

/** Writes records to acme.yards.v1.YardQueryService. */
class CarryExperimentReportMessageYardQuery implements CarryExperimentReportMessageTarget {
  private readonly client: yardsYardQueryServiceApi.YardQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new yardsYardQueryServiceApi.YardQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryExperimentReportMessageRecord): Promise<void> {
    await call<yardsYardQueryServiceApi.BrowseYardsRequest, yardsYardQueryServiceApi.BrowseYardsResponse>(
      (request, done) => this.client.browseYards(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      yardsYardQueryServiceApi.BrowseYardsRequest.fromPartial({ orderBy: record.experimentId, filter: { region: record.title } }));
  }
}

/** Passes records to acme.chat.v1.ChatBotApprovalService. */
class CarryExperimentReportMessageChatBotApproval implements CarryExperimentReportMessageTarget {
  private readonly client: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryExperimentReportMessageRecord): Promise<void> {
    await retry(() => call<chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest, chatChatBotApprovalServiceApi.GetChatBotApprovalStatusResponse>(
      (request, done) => this.client.getChatBotApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatBotApprovalServiceApi.GetChatBotApprovalStatusRequest.fromPartial({ chatBotId: record.status })));
  }
}

/**
 * Reads acme.experiments.v1.ExperimentReportingService/FetchExperimentReport and hands what it keeps to the
 * sink of its kind.
 */
export async function carryExperimentReportMessage(runtime: Runtime): Promise<void> {
  const upstream = new experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<experimentsExperimentReportingServiceApi.FetchExperimentReportRequest, experimentsExperimentReportingServiceApi.FetchExperimentReportResponse>(
    (request, done) => upstream.fetchExperimentReport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExperimentReportingServiceApi.FetchExperimentReportRequest.fromPartial({ experimentId: "live-carry-experiment-report-message" }));
  const record: CarryExperimentReportMessageRecord = {
    message: found.result?.message ?? "",
    title: found.experiment?.title ?? "",
    status: text.normalize(found.result?.status ?? ""),
    experimentId: text.normalize(found.experiment?.experimentId ?? ""),
  };
  const registry: Record<string, CarryExperimentReportMessageTarget> = {};
  for (const entry of [
    { kind: "form-validation", sink: new CarryExperimentReportMessageFormValidation(runtime) },
    { kind: "question-validation", sink: new CarryExperimentReportMessageQuestionValidation(runtime) },
    { kind: "yard-query", sink: new CarryExperimentReportMessageYardQuery(runtime) },
    { kind: "chat-bot-approval", sink: new CarryExperimentReportMessageChatBotApproval(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["yard-query"]!.apply(record);
}
