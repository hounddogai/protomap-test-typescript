import * as contentContentBlockWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as lineageLineageNodeServiceApi from "../../../.cache/proto/acme/lineage/v1/lineage_node_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routePendingSurveysMessage keeps of each ListPendingSurveys response. */
interface RoutePendingSurveysMessageRecord {
  message: string;
  correlationId: string;
  nextPageToken: string;
  status: string;
}

/** Where routePendingSurveysMessage hands each record. */
interface RoutePendingSurveysMessageWriter {
  push(record: RoutePendingSurveysMessageRecord): Promise<void>;
}

/** Passes records to acme.content.v1.ContentBlockWorkflowService. */
class RoutePendingSurveysMessageContentBlockWorkflow implements RoutePendingSurveysMessageWriter {
  private readonly client: contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockWorkflowServiceApi.ContentBlockWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RoutePendingSurveysMessageRecord): Promise<void> {
    await call<contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowRequest, contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse>(
      (request, done) => this.client.retryContentBlockWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowRequest.fromPartial({ details: { initiatedBy: record.status }, contentBlock: { name: record.correlationId }, contentBlockId: record.nextPageToken }));
  }
}

/** Sends records to acme.lineage.v1.LineageNodeService. */
class RoutePendingSurveysMessageLineageNode implements RoutePendingSurveysMessageWriter {
  private readonly client: lineageLineageNodeServiceApi.LineageNodeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lineageLineageNodeServiceApi.LineageNodeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RoutePendingSurveysMessageRecord): Promise<void> {
    await call<lineageLineageNodeServiceApi.CreateLineageNodeRequest, lineageLineageNodeServiceApi.CreateLineageNodeResponse>(
      (request, done) => this.client.createLineageNode(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      lineageLineageNodeServiceApi.CreateLineageNodeRequest.fromPartial({ lineageNode: { name: record.message } }));
  }
}

/** Passes records to acme.surveys.v1.SurveyWorkflowService. */
class RoutePendingSurveysMessageSurveyWorkflow implements RoutePendingSurveysMessageWriter {
  private readonly client: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RoutePendingSurveysMessageRecord): Promise<void> {
    await call<surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowResponse>(
      (request, done) => this.client.pauseSurveyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyWorkflowServiceApi.PauseSurveyWorkflowRequest.fromPartial({ survey: { surveyId: record.nextPageToken, number: record.correlationId } }));
  }
}

/**
 * Reads acme.surveys.v1.SurveyApprovalService/ListPendingSurveys and hands what it keeps to the sink of its
 * kind.
 */
export async function routePendingSurveysMessage(runtime: Runtime): Promise<void> {
  const origin = new surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<surveysSurveyApprovalServiceApi.ListPendingSurveysRequest, surveysSurveyApprovalServiceApi.ListPendingSurveysResponse>(
    (request, done) => origin.listPendingSurveys(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    surveysSurveyApprovalServiceApi.ListPendingSurveysRequest.fromPartial({ orderBy: "main-route-pending-surveys-message" }));
  const row: RoutePendingSurveysMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
    status: text.normalize(found.result?.status ?? ""),
  };
  const sinks = new Map<string, RoutePendingSurveysMessageWriter>([
    ["content-block-workflow", new RoutePendingSurveysMessageContentBlockWorkflow(runtime)],
    ["lineage-node", new RoutePendingSurveysMessageLineageNode(runtime)],
    ["survey-workflow", new RoutePendingSurveysMessageSurveyWorkflow(runtime)],
  ]);
  const sink = sinks.get(process.env["ROUTE_PENDING_SURVEYS_MESSAGE_TARGET"] ?? "");
  if (!sink) return;
  await sink.push(row);
}
