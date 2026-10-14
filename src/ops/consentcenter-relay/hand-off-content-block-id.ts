import * as appointmentsAppointmentQueryServiceApi from "../../../.cache/proto/acme/appointments/v1/appointment_query_service.js";
import * as contentArticleServiceApi from "../../../.cache/proto/acme/content/v1/article_service.js";
import * as contentContentBlockApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffContentBlockId keeps of each SubmitContentBlock response. */
interface HandOffContentBlockIdRecord {
  parentId: string;
  referenceId: string;
  contentBlockId: string;
}

/** Where handOffContentBlockId hands each record. */
interface HandOffContentBlockIdTarget {
  write(record: HandOffContentBlockIdRecord): Promise<void>;
}

/** Hands records to acme.content.v1.ArticleService. */
class HandOffContentBlockIdArticle implements HandOffContentBlockIdTarget {
  private readonly client: contentArticleServiceApi.ArticleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleServiceApi.ArticleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffContentBlockIdRecord): Promise<void> {
    await call<contentArticleServiceApi.DeleteArticleRequest, contentArticleServiceApi.DeleteArticleResponse>(
      (request, done) => this.client.deleteArticle(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentArticleServiceApi.DeleteArticleRequest.fromPartial({ etag: record.referenceId, articleId: record.parentId, reason: record.contentBlockId }));
  }
}

/** Sends records to acme.personalization.v1.RecommendationCalculationService. */
class HandOffContentBlockIdRecommendationCalculation implements HandOffContentBlockIdTarget {
  private readonly client: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffContentBlockIdRecord): Promise<void> {
    await retry(() => call<personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest, personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsResponse>(
      (request, done) => this.client.compareRecommendationOptions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationCalculationServiceApi.CompareRecommendationOptionsRequest.fromPartial({ reason: record.referenceId, recommendation: { recommendationId: record.parentId } })));
  }
}

/** Writes records to acme.appointments.v1.AppointmentQueryService. */
class HandOffContentBlockIdAppointmentQuery implements HandOffContentBlockIdTarget {
  private readonly client: appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: HandOffContentBlockIdRecord): Promise<void> {
    await call<appointmentsAppointmentQueryServiceApi.PeekAppointmentRequest, appointmentsAppointmentQueryServiceApi.PeekAppointmentResponse>(
      (request, done) => this.client.peekAppointment(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      appointmentsAppointmentQueryServiceApi.PeekAppointmentRequest.fromPartial({ appointmentId: record.contentBlockId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffContentBlockIdLogOnly implements HandOffContentBlockIdTarget {
  async write(record: HandOffContentBlockIdRecord): Promise<void> {
    console.info("no sink for record", record.parentId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchHandOffContentBlockId(kind: string, record: HandOffContentBlockIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: HandOffContentBlockIdRecord): Promise<void> => new HandOffContentBlockIdLogOnly().write(item);
  switch (kind) {
    case "article":
      write = (item) => new HandOffContentBlockIdArticle(runtime).write(item);
      break;
    case "recommendation-calculation":
      write = (item) => new HandOffContentBlockIdRecommendationCalculation(runtime).write(item);
      break;
    case "appointment-query":
      write = (item) => new HandOffContentBlockIdAppointmentQuery(runtime).write(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.content.v1.ContentBlockApprovalService/SubmitContentBlock and hands what it keeps to the sink of
 * its kind.
 */
export async function handOffContentBlockId(runtime: Runtime): Promise<void> {
  const reader = new contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<contentContentBlockApprovalServiceApi.SubmitContentBlockRequest, contentContentBlockApprovalServiceApi.SubmitContentBlockResponse>(
    (request, done) => reader.submitContentBlock(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    contentContentBlockApprovalServiceApi.SubmitContentBlockRequest.fromPartial({ contentBlockId: "nightly-hand-off-content-block-id" })));
  const record: HandOffContentBlockIdRecord = {
    parentId: current.contentBlock?.parentId ?? "",
    referenceId: text.normalize(current.outcome?.referenceId ?? ""),
    contentBlockId: current.contentBlock?.contentBlockId ?? "",
  };
  await dispatchHandOffContentBlockId("appointment-query", record, runtime);
}
