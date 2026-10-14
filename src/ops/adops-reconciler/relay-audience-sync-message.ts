import * as audiencesAudienceSyncApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as contentArticleServiceApi from "../../../.cache/proto/acme/content/v1/article_service.js";
import * as itsmIncidentCalculationServiceApi from "../../../.cache/proto/acme/itsm/v1/incident_calculation_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayAudienceSyncMessage keeps of each ApproveAudienceSync response. */
interface RelayAudienceSyncMessageRecord {
  message: string;
  correlationId: string;
}

/** Where relayAudienceSyncMessage hands each record. */
interface RelayAudienceSyncMessageWriter {
  write(record: RelayAudienceSyncMessageRecord): Promise<void>;
}

/** Sends records to acme.content.v1.ArticleService. */
class RelayAudienceSyncMessageArticle implements RelayAudienceSyncMessageWriter {
  private readonly client: contentArticleServiceApi.ArticleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleServiceApi.ArticleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayAudienceSyncMessageRecord): Promise<void> {
    await call<contentArticleServiceApi.CreateArticleRequest, contentArticleServiceApi.CreateArticleResponse>(
      (request, done) => this.client.createArticle(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contentArticleServiceApi.CreateArticleRequest.fromPartial({ article: { notes: record.correlationId, articleId: record.message } }));
  }
}

/** Sends records to acme.itsm.v1.IncidentCalculationService. */
class RelayAudienceSyncMessageIncidentCalculation implements RelayAudienceSyncMessageWriter {
  private readonly client: itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new itsmIncidentCalculationServiceApi.IncidentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayAudienceSyncMessageRecord): Promise<void> {
    await call<itsmIncidentCalculationServiceApi.SimulateIncidentRequest, itsmIncidentCalculationServiceApi.SimulateIncidentResponse>(
      (request, done) => this.client.simulateIncident(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      itsmIncidentCalculationServiceApi.SimulateIncidentRequest.fromPartial({ incident: { incidentId: record.correlationId } }));
  }
}

/** Passes records to acme.surveys.v1.QuestionCalculationService. */
class RelayAudienceSyncMessageQuestionCalculation implements RelayAudienceSyncMessageWriter {
  private readonly client: surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayAudienceSyncMessageRecord): Promise<void> {
    await call<surveysQuestionCalculationServiceApi.SimulateQuestionRequest, surveysQuestionCalculationServiceApi.SimulateQuestionResponse>(
      (request, done) => this.client.simulateQuestion(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysQuestionCalculationServiceApi.SimulateQuestionRequest.fromPartial({ questionId: record.message }));
  }
}

/**
 * Reads acme.audiences.v1.AudienceSyncApprovalService/ApproveAudienceSync and hands what it keeps to the sink
 * of its kind.
 */
export async function relayAudienceSyncMessage(runtime: Runtime): Promise<void> {
  const source = new audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncRequest, audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncResponse>(
    (request, done) => source.approveAudienceSync(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    audiencesAudienceSyncApprovalServiceApi.ApproveAudienceSyncRequest.fromPartial({ reason: "current-relay-audience-sync-message" }));
  const row: RelayAudienceSyncMessageRecord = {
    message: found.outcome?.message ?? "",
    correlationId: found.audienceSync?.correlationId ?? "",
  };
  const sinks = new Map<string, RelayAudienceSyncMessageWriter>();
  sinks.set("article", new RelayAudienceSyncMessageArticle(runtime));
  sinks.set("incident-calculation", new RelayAudienceSyncMessageIncidentCalculation(runtime));
  sinks.set("question-calculation", new RelayAudienceSyncMessageQuestionCalculation(runtime));
  await sinks.get("question-calculation")!.write(row);
}
