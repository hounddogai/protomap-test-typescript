import * as fanportalFanSessionQueryServiceApi from "../../../.cache/proto/acme/fanportal/v1/fan_session_query_service.js";
import * as formsFormApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as searchSearchIndexServiceApi from "../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as surveysQuestionValidationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushQuestionRulesStatus keeps of each GetQuestionRules response. */
interface PushQuestionRulesStatusRecord {
  status: string;
  questionId: string;
}

/** Where pushQuestionRulesStatus hands each record. */
interface PushQuestionRulesStatusSink {
  write(record: PushQuestionRulesStatusRecord): Promise<void>;
}

/** Hands records to acme.forms.v1.FormApprovalService. */
class PushQuestionRulesStatusFormApproval implements PushQuestionRulesStatusSink {
  private readonly client: formsFormApprovalServiceApi.FormApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormApprovalServiceApi.FormApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushQuestionRulesStatusRecord): Promise<void> {
    await retry(() => call<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(
      (request, done) => this.client.escalateForm(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({ details: { approverEmail: record.questionId } })));
  }
}

/** Writes records to acme.search.v1.SearchIndexService. */
class PushQuestionRulesStatusSearchIndex implements PushQuestionRulesStatusSink {
  private readonly client: searchSearchIndexServiceApi.SearchIndexServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexServiceApi.SearchIndexServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushQuestionRulesStatusRecord): Promise<void> {
    await call<searchSearchIndexServiceApi.GetSearchIndexRequest, searchSearchIndexServiceApi.GetSearchIndexResponse>(
      (request, done) => this.client.getSearchIndex(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      searchSearchIndexServiceApi.GetSearchIndexRequest.fromPartial({ searchIndexId: record.questionId }));
  }
}

/** Hands records to acme.fanportal.v1.FanSessionQueryService. */
class PushQuestionRulesStatusFanSessionQuery implements PushQuestionRulesStatusSink {
  private readonly client: fanportalFanSessionQueryServiceApi.FanSessionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fanportalFanSessionQueryServiceApi.FanSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PushQuestionRulesStatusRecord): Promise<void> {
    await call<fanportalFanSessionQueryServiceApi.LookupFanSessionRequest, fanportalFanSessionQueryServiceApi.LookupFanSessionResponse>(
      (request, done) => this.client.lookupFanSession(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      fanportalFanSessionQueryServiceApi.LookupFanSessionRequest.fromPartial({ fanSessionId: record.status }));
  }
}

/**
 * Reads acme.surveys.v1.QuestionValidationService/GetQuestionRules and hands what it keeps to the sink of its
 * kind.
 */
export async function pushQuestionRulesStatus(runtime: Runtime): Promise<void> {
  const reader = new surveysQuestionValidationServiceApi.QuestionValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<surveysQuestionValidationServiceApi.GetQuestionRulesRequest, surveysQuestionValidationServiceApi.GetQuestionRulesResponse>(
    (request, done) => reader.getQuestionRules(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    surveysQuestionValidationServiceApi.GetQuestionRulesRequest.fromPartial({ questionId: "current-push-question-rules-status" }));
  const row: PushQuestionRulesStatusRecord = {
    status: found.result?.status ?? "",
    questionId: text.normalize(found.question?.questionId ?? ""),
  };
  const sinks: PushQuestionRulesStatusSink[] = [
    new PushQuestionRulesStatusFormApproval(runtime),
    new PushQuestionRulesStatusSearchIndex(runtime),
    new PushQuestionRulesStatusFanSessionQuery(runtime),
  ];
  await sinks[0]!.write(row);
}
