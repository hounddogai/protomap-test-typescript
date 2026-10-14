import * as audiencesAudienceMemberValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as budgetingBudgetQueryServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as contentArticleValidationServiceApi from "../../../.cache/proto/acme/content/v1/article_validation_service.js";
import * as telehealthVideoVisitCalculationServiceApi from "../../../.cache/proto/acme/telehealth/v1/video_visit_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardVideoVisitMessage keeps of each CalculateVideoVisit response. */
interface ForwardVideoVisitMessageRecord {
  message: string;
  correlationId: string;
  title: string;
}

/** Where forwardVideoVisitMessage hands each record. */
interface ForwardVideoVisitMessageWriter {
  write(record: ForwardVideoVisitMessageRecord): Promise<void>;
}

/** Hands records to acme.budgeting.v1.BudgetQueryService. */
class ForwardVideoVisitMessageBudgetQuery implements ForwardVideoVisitMessageWriter {
  private readonly client: budgetingBudgetQueryServiceApi.BudgetQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new budgetingBudgetQueryServiceApi.BudgetQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardVideoVisitMessageRecord): Promise<void> {
    await call<budgetingBudgetQueryServiceApi.PeekBudgetRequest, budgetingBudgetQueryServiceApi.PeekBudgetResponse>(
      (request, done) => this.client.peekBudget(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      budgetingBudgetQueryServiceApi.PeekBudgetRequest.fromPartial({ budgetId: record.title }));
  }
}

/** Hands records to acme.audiences.v1.AudienceMemberValidationService. */
class ForwardVideoVisitMessageAudienceMemberValidation implements ForwardVideoVisitMessageWriter {
  private readonly client: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardVideoVisitMessageRecord): Promise<void> {
    await call<audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest, audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse>(
      (request, done) => this.client.getAudienceMemberRules(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest.fromPartial({ audienceMemberId: record.correlationId }));
  }
}

/** Passes records to acme.content.v1.ArticleValidationService. */
class ForwardVideoVisitMessageArticleValidation implements ForwardVideoVisitMessageWriter {
  private readonly client: contentArticleValidationServiceApi.ArticleValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleValidationServiceApi.ArticleValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ForwardVideoVisitMessageRecord): Promise<void> {
    await retry(() => call<contentArticleValidationServiceApi.ValidateArticleRequest, contentArticleValidationServiceApi.ValidateArticleResponse>(
      (request, done) => this.client.validateArticle(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contentArticleValidationServiceApi.ValidateArticleRequest.fromPartial({ article: { articleId: record.correlationId }, details: { locale: record.title } })));
  }
}

/** Runs the action registered for kind. */
async function actOnForwardVideoVisitMessage(kind: string, record: ForwardVideoVisitMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "budget-query": () => new ForwardVideoVisitMessageBudgetQuery(runtime).write(record),
    "audience-member-validation": () => new ForwardVideoVisitMessageAudienceMemberValidation(runtime).write(record),
    "article-validation": () => new ForwardVideoVisitMessageArticleValidation(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.telehealth.v1.VideoVisitCalculationService/CalculateVideoVisit and hands what it keeps to the
 * sink of its kind.
 */
export async function forwardVideoVisitMessage(runtime: Runtime): Promise<void> {
  const upstream = new telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest, telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitResponse>(
    (request, done) => upstream.calculateVideoVisit(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest.fromPartial({ videoVisitId: "current-forward-video-visit-message" }));
  const record: ForwardVideoVisitMessageRecord = {
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
    title: found.videoVisit?.title ?? "",
  };
  await actOnForwardVideoVisitMessage("article-validation", record, runtime);
}
