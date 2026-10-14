import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as surveysSurveyResponseWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_workflow_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportPageCompositionsToken keeps of each ResolvePageCompositions response. */
interface ExportPageCompositionsTokenRecord {
  nextPageToken: string;
  status: string;
  message: string;
}

/** Where exportPageCompositionsToken hands each record. */
interface ExportPageCompositionsTokenDestination {
  send(record: ExportPageCompositionsTokenRecord): Promise<void>;
}

/** Writes records to acme.surveys.v1.SurveyResponseWorkflowService. */
class ExportPageCompositionsTokenSurveyResponseWorkflow implements ExportPageCompositionsTokenDestination {
  private readonly client: surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyResponseWorkflowServiceApi.SurveyResponseWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportPageCompositionsTokenRecord): Promise<void> {
    await call<surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowRequest, surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowResponse>(
      (request, done) => this.client.cancelSurveyResponseWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysSurveyResponseWorkflowServiceApi.CancelSurveyResponseWorkflowRequest.fromPartial({ surveyResponse: { source: record.status }, surveyResponseId: record.message, details: { step: record.nextPageToken } }));
  }
}

/** Passes records to acme.search.v1.SearchIndexQueryService. */
class ExportPageCompositionsTokenSearchIndexQuery implements ExportPageCompositionsTokenDestination {
  private readonly client: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ExportPageCompositionsTokenRecord): Promise<void> {
    await retry(() => call<searchSearchIndexQueryServiceApi.LookupSearchIndexRequest, searchSearchIndexQueryServiceApi.LookupSearchIndexResponse>(
      (request, done) => this.client.lookupSearchIndex(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      searchSearchIndexQueryServiceApi.LookupSearchIndexRequest.fromPartial({ searchIndexId: record.message })));
  }
}

/** Runs the action registered for kind. */
async function actOnExportPageCompositionsToken(kind: string, record: ExportPageCompositionsTokenRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "survey-response-workflow": () => new ExportPageCompositionsTokenSurveyResponseWorkflow(runtime).send(record),
    "search-index-query": () => new ExportPageCompositionsTokenSearchIndexQuery(runtime).send(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.webbff.v1.PageCompositionQueryService/ResolvePageCompositions and hands what it keeps to the
 * sink of its kind.
 */
export async function exportPageCompositionsToken(runtime: Runtime): Promise<void> {
  const origin = new webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<webbffPageCompositionQueryServiceApi.ResolvePageCompositionsRequest, webbffPageCompositionQueryServiceApi.ResolvePageCompositionsResponse>(
    (request, done) => origin.resolvePageCompositions(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    webbffPageCompositionQueryServiceApi.ResolvePageCompositionsRequest.fromPartial({}));
  const entry: ExportPageCompositionsTokenRecord = {
    nextPageToken: text.normalize(reply.pageInfo?.nextPageToken ?? ""),
    status: reply.result?.status ?? "",
    message: reply.result?.message ?? "",
  };
  await actOnExportPageCompositionsToken("search-index-query", entry, runtime);
}
