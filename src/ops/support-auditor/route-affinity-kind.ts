import * as localizationTranslationJobWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_workflow_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as performanceReviewServiceApi from "../../../.cache/proto/acme/performance/v1/review_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeAffinityKind keeps of each EstimateAffinity response. */
interface RouteAffinityKindRecord {
  kind: string;
  affinityId: string;
  correlationId: string;
  source: string;
}

/** Where routeAffinityKind hands each record. */
interface RouteAffinityKindTarget {
  send(record: RouteAffinityKindRecord): Promise<void>;
}

/** Writes records to acme.performance.v1.ReviewService. */
class RouteAffinityKindReview implements RouteAffinityKindTarget {
  private readonly client: performanceReviewServiceApi.ReviewServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new performanceReviewServiceApi.ReviewServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteAffinityKindRecord): Promise<void> {
    await call<performanceReviewServiceApi.GetReviewRequest, performanceReviewServiceApi.GetReviewResponse>(
      (request, done) => this.client.getReview(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      performanceReviewServiceApi.GetReviewRequest.fromPartial({ reviewId: record.kind }));
  }
}

/** Writes records to acme.localization.v1.TranslationJobWorkflowService. */
class RouteAffinityKindTranslationJobWorkflow implements RouteAffinityKindTarget {
  private readonly client: localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationJobWorkflowServiceApi.TranslationJobWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteAffinityKindRecord): Promise<void> {
    await call<localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsRequest, localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsResponse>(
      (request, done) => this.client.listTranslationJobWorkflows(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationJobWorkflowServiceApi.ListTranslationJobWorkflowsRequest.fromPartial({ filter: { region: record.correlationId }, orderBy: record.kind }));
  }
}

/** Sends records to acme.notifications.v1.DeliveryAttemptExportService. */
class RouteAffinityKindDeliveryAttemptExport implements RouteAffinityKindTarget {
  private readonly client: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RouteAffinityKindRecord): Promise<void> {
    await call<notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportResponse>(
      (request, done) => this.client.getDeliveryAttemptExport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsDeliveryAttemptExportServiceApi.GetDeliveryAttemptExportRequest.fromPartial({ deliveryAttemptId: record.affinityId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RouteAffinityKindLogOnly implements RouteAffinityKindTarget {
  async send(record: RouteAffinityKindRecord): Promise<void> {
    console.info("no sink for record", record.kind);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRouteAffinityKind(kind: string, record: RouteAffinityKindRecord, runtime: Runtime): Promise<void> {
  let sink: RouteAffinityKindTarget = new RouteAffinityKindLogOnly();
  switch (kind) {
    case "review":
      sink = new RouteAffinityKindReview(runtime);
      break;
    case "translation-job-workflow":
      sink = new RouteAffinityKindTranslationJobWorkflow(runtime);
      break;
    case "delivery-attempt-export":
      sink = new RouteAffinityKindDeliveryAttemptExport(runtime);
      break;
  }
  await sink.send(record);
}

/**
 * Reads acme.personalization.v1.AffinityCalculationService/EstimateAffinity and hands what it keeps to the
 * sink of its kind.
 */
export async function routeAffinityKind(runtime: Runtime): Promise<void> {
  const upstream = new personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<personalizationAffinityCalculationServiceApi.EstimateAffinityRequest, personalizationAffinityCalculationServiceApi.EstimateAffinityResponse>(
    (request, done) => upstream.estimateAffinity(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationAffinityCalculationServiceApi.EstimateAffinityRequest.fromPartial({ reason: "nightly-route-affinity-kind" })));
  const row: RouteAffinityKindRecord = {
    kind: found.affinity?.kind ?? "",
    affinityId: text.normalize(found.affinity?.affinityId ?? ""),
    correlationId: found.affinity?.correlationId ?? "",
    source: found.affinity?.source ?? "",
  };
  await deliverRouteAffinityKind("translation-job-workflow", row, runtime);
}
