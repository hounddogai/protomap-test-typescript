import * as collectionsCollectionCaseQueryServiceApi from "../../../.cache/proto/acme/collections/v1/collection_case_query_service.js";
import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as surveysSurveyResponseQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_response_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncSurveyResponseId keeps of each LookupSurveyResponse response. */
interface SyncSurveyResponseIdRecord {
  surveyResponseId: string;
  status: string;
  correlationId: string;
  surveyResponseCorrelationId: string;
}

/** Where syncSurveyResponseId hands each record. */
interface SyncSurveyResponseIdWriter {
  apply(record: SyncSurveyResponseIdRecord): Promise<void>;
}

/** Writes records to acme.community.v1.ForumApprovalService. */
class SyncSurveyResponseIdForumApproval implements SyncSurveyResponseIdWriter {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncSurveyResponseIdRecord): Promise<void> {
    await call<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>(
      (request, done) => this.client.listPendingForums(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityForumApprovalServiceApi.ListPendingForumsRequest.fromPartial({ page: { pageToken: record.correlationId } }));
  }
}

/** Hands records to acme.collections.v1.CollectionCaseQueryService. */
class SyncSurveyResponseIdCollectionCaseQuery implements SyncSurveyResponseIdWriter {
  private readonly client: collectionsCollectionCaseQueryServiceApi.CollectionCaseQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new collectionsCollectionCaseQueryServiceApi.CollectionCaseQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncSurveyResponseIdRecord): Promise<void> {
    await call<collectionsCollectionCaseQueryServiceApi.CountCollectionCasesRequest, collectionsCollectionCaseQueryServiceApi.CountCollectionCasesResponse>(
      (request, done) => this.client.countCollectionCases(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      collectionsCollectionCaseQueryServiceApi.CountCollectionCasesRequest.fromPartial({ page: { pageToken: record.status } }));
  }
}

/** Passes records to acme.experiments.v1.VariantApprovalService. */
class SyncSurveyResponseIdVariantApproval implements SyncSurveyResponseIdWriter {
  private readonly client: experimentsVariantApprovalServiceApi.VariantApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantApprovalServiceApi.VariantApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: SyncSurveyResponseIdRecord): Promise<void> {
    await call<experimentsVariantApprovalServiceApi.ApproveVariantRequest, experimentsVariantApprovalServiceApi.ApproveVariantResponse>(
      (request, done) => this.client.approveVariant(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantApprovalServiceApi.ApproveVariantRequest.fromPartial({ variantId: record.correlationId, details: { comment: record.surveyResponseCorrelationId, approverEmail: record.surveyResponseId } }));
  }
}

/**
 * Reads acme.surveys.v1.SurveyResponseQueryService/LookupSurveyResponse and hands what it keeps to the sink
 * of its kind.
 */
export async function syncSurveyResponseId(runtime: Runtime): Promise<void> {
  const reader = new surveysSurveyResponseQueryServiceApi.SurveyResponseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<surveysSurveyResponseQueryServiceApi.LookupSurveyResponseRequest, surveysSurveyResponseQueryServiceApi.LookupSurveyResponseResponse>(
    (request, done) => reader.lookupSurveyResponse(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    surveysSurveyResponseQueryServiceApi.LookupSurveyResponseRequest.fromPartial({ surveyResponseId: "current-sync-survey-response-id" }));
  const kept: SyncSurveyResponseIdRecord = {
    surveyResponseId: reply.surveyResponse?.surveyResponseId ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    correlationId: reply.result?.correlationId ?? "",
    surveyResponseCorrelationId: text.normalize(reply.surveyResponse?.correlationId ?? ""),
  };
  const sinks: SyncSurveyResponseIdWriter[] = [
    new SyncSurveyResponseIdForumApproval(runtime),
    new SyncSurveyResponseIdCollectionCaseQuery(runtime),
    new SyncSurveyResponseIdVariantApproval(runtime),
  ];
  await sinks[1]!.apply(kept);
}
