/**
 * Register the experiments team's public gRPC boundary and workers.
 */

import * as auditAuditEventValidationServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityBadgeApprovalServiceApi from "../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumValidationServiceApi from "../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsExperimentLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExperimentReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_reporting_service.js";
import * as experimentsExperimentServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExperimentWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_workflow_service.js";
import * as experimentsExposureApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_approval_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as experimentsExposureImportServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as experimentsExposureLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_lifecycle_service.js";
import * as experimentsExposureReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_reporting_service.js";
import * as experimentsExposureSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_sync_service.js";
import * as experimentsExposureValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsExposureWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as experimentsVariantApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_approval_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as experimentsVariantLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_lifecycle_service.js";
import * as experimentsVariantQueryServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as experimentsVariantReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as experimentsVariantValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as experimentsVariantWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_workflow_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as toursTourQueryServiceApi from "../../../.cache/proto/acme/tours/v1/tour_query_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  ExperimentApprovalHandler,
  implementation as bindExperimentApprovalHandler,
} from "./features/experiment/experiment-approval.handler.js";
import {
  ExperimentQueryHandler,
  implementation as bindExperimentQueryHandler,
} from "./features/experiment/experiment-query.handler.js";
import {
  ExperimentValidationHandler,
  implementation as bindExperimentValidationHandler,
} from "./features/experiment/experiment-validation.handler.js";
import {
  ExposureCalculationHandler,
  implementation as bindExposureCalculationHandler,
} from "./features/exposure/exposure-calculation.handler.js";
import {
  ExposureReportingHandler,
  implementation as bindExposureReportingHandler,
} from "./features/exposure/exposure-reporting.handler.js";
import {
  ExposureWorkflowHandler,
  implementation as bindExposureWorkflowHandler,
} from "./features/exposure/exposure-workflow.handler.js";
import {
  VariantLifecycleHandler,
  implementation as bindVariantLifecycleHandler,
} from "./features/variant/variant-lifecycle.handler.js";
import {
  VariantSyncHandler,
  implementation as bindVariantSyncHandler,
} from "./features/variant/variant-sync.handler.js";
import {
  ExperimentLifecycleHandler,
  implementation as bindExperimentLifecycleHandler,
} from "./services/experiment-lifecycle.js";
import { ExperimentHandler, implementation as bindExperimentHandler } from "./services/experiment.js";
import {
  ExposureApprovalHandler,
  implementation as bindExposureApprovalHandler,
} from "./services/exposure-approval.js";
import {
  ExposureLifecycleHandler,
  implementation as bindExposureLifecycleHandler,
} from "./services/exposure-lifecycle.js";
import {
  ExposureValidationHandler,
  implementation as bindExposureValidationHandler,
} from "./services/exposure-validation.js";
import {
  VariantCalculationHandler,
  implementation as bindVariantCalculationHandler,
} from "./services/variant-calculation.js";
import {
  VariantReportingHandler,
  implementation as bindVariantReportingHandler,
} from "./services/variant-reporting.js";
import { VariantWorkflowHandler, implementation as bindVariantWorkflowHandler } from "./services/variant-workflow.js";
import {
  ExperimentCalculationHandler,
  implementation as bindExperimentCalculationHandler,
} from "./transport/experiment-calculation.js";
import {
  ExperimentReportingHandler,
  implementation as bindExperimentReportingHandler,
} from "./transport/experiment-reporting.js";
import {
  ExperimentWorkflowHandler,
  implementation as bindExperimentWorkflowHandler,
} from "./transport/experiment-workflow.js";
import { ExposureImportHandler, implementation as bindExposureImportHandler } from "./transport/exposure-import.js";
import { ExposureSyncHandler, implementation as bindExposureSyncHandler } from "./transport/exposure-sync.js";
import { VariantApprovalHandler, implementation as bindVariantApprovalHandler } from "./transport/variant-approval.js";
import { VariantQueryHandler, implementation as bindVariantQueryHandler } from "./transport/variant-query.js";
import {
  VariantValidationHandler,
  implementation as bindVariantValidationHandler,
} from "./transport/variant-validation.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceService, bindExperimentApprovalHandler(scope.resolve(ExperimentApprovalHandler)));
  server.addService(experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceService, bindExperimentCalculationHandler(scope.resolve(ExperimentCalculationHandler)));
  server.addService(experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceService, bindExperimentLifecycleHandler(scope.resolve(ExperimentLifecycleHandler)));
  server.addService(experimentsExperimentQueryServiceApi.ExperimentQueryServiceService, bindExperimentQueryHandler(scope.resolve(ExperimentQueryHandler)));
  server.addService(experimentsExperimentReportingServiceApi.ExperimentReportingServiceService, bindExperimentReportingHandler(scope.resolve(ExperimentReportingHandler)));
  server.addService(experimentsExperimentServiceApi.ExperimentServiceService, bindExperimentHandler(scope.resolve(ExperimentHandler)));
  server.addService(experimentsExperimentValidationServiceApi.ExperimentValidationServiceService, bindExperimentValidationHandler(scope.resolve(ExperimentValidationHandler)));
  server.addService(experimentsExperimentWorkflowServiceApi.ExperimentWorkflowServiceService, bindExperimentWorkflowHandler(scope.resolve(ExperimentWorkflowHandler)));
  server.addService(experimentsExposureApprovalServiceApi.ExposureApprovalServiceService, bindExposureApprovalHandler(scope.resolve(ExposureApprovalHandler)));
  server.addService(experimentsExposureCalculationServiceApi.ExposureCalculationServiceService, bindExposureCalculationHandler(scope.resolve(ExposureCalculationHandler)));
  server.addService(experimentsExposureImportServiceApi.ExposureImportServiceService, bindExposureImportHandler(scope.resolve(ExposureImportHandler)));
  server.addService(experimentsExposureLifecycleServiceApi.ExposureLifecycleServiceService, bindExposureLifecycleHandler(scope.resolve(ExposureLifecycleHandler)));
  server.addService(experimentsExposureReportingServiceApi.ExposureReportingServiceService, bindExposureReportingHandler(scope.resolve(ExposureReportingHandler)));
  server.addService(experimentsExposureSyncServiceApi.ExposureSyncServiceService, bindExposureSyncHandler(scope.resolve(ExposureSyncHandler)));
  server.addService(experimentsExposureValidationServiceApi.ExposureValidationServiceService, bindExposureValidationHandler(scope.resolve(ExposureValidationHandler)));
  server.addService(experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceService, bindExposureWorkflowHandler(scope.resolve(ExposureWorkflowHandler)));
  server.addService(experimentsVariantApprovalServiceApi.VariantApprovalServiceService, bindVariantApprovalHandler(scope.resolve(VariantApprovalHandler)));
  server.addService(experimentsVariantCalculationServiceApi.VariantCalculationServiceService, bindVariantCalculationHandler(scope.resolve(VariantCalculationHandler)));
  server.addService(experimentsVariantLifecycleServiceApi.VariantLifecycleServiceService, bindVariantLifecycleHandler(scope.resolve(VariantLifecycleHandler)));
  server.addService(experimentsVariantQueryServiceApi.VariantQueryServiceService, bindVariantQueryHandler(scope.resolve(VariantQueryHandler)));
  server.addService(experimentsVariantReportingServiceApi.VariantReportingServiceService, bindVariantReportingHandler(scope.resolve(VariantReportingHandler)));
  server.addService(experimentsVariantSyncServiceApi.VariantSyncServiceService, bindVariantSyncHandler(scope.resolve(VariantSyncHandler)));
  server.addService(experimentsVariantValidationServiceApi.VariantValidationServiceService, bindVariantValidationHandler(scope.resolve(VariantValidationHandler)));
  server.addService(experimentsVariantWorkflowServiceApi.VariantWorkflowServiceService, bindVariantWorkflowHandler(scope.resolve(VariantWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient>("acme.notifications.v1.SubscriptionApprovalService");
  queue.consume<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>("acme.experiments.v1.ExperimentCalculationService/ExplainExperimentCalculation:0", async (request) =>
    call<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>((input, done) => client0.commentSubscriptionApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<experimentsExposureSyncServiceApi.ExposureSyncServiceClient>("acme.experiments.v1.ExposureSyncService");
  queue.consume<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>("acme.experiments.v1.ExperimentLifecycleService/ScheduleExperimentExpiry:1", async (request) =>
    call<experimentsExposureSyncServiceApi.ReconcileExposuresRequest, experimentsExposureSyncServiceApi.ReconcileExposuresResponse>((input, done) => client1.reconcileExposures(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<experimentsExposureValidationServiceApi.ExposureValidationServiceClient>("acme.experiments.v1.ExposureValidationService");
  queue.consume<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>("acme.experiments.v1.ExperimentReportingService/DeleteExperimentReport:3", async (request) =>
    call<experimentsExposureValidationServiceApi.LintExposuresRequest, experimentsExposureValidationServiceApi.LintExposuresResponse>((input, done) => client2.lintExposures(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient>("acme.experiments.v1.ExperimentValidationService");
  queue.consume<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>("acme.experiments.v1.ExperimentService/UpdateExperiment:0", async (request) =>
    call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>((input, done) => client3.checkExperimentEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceClient>("acme.personalization.v1.AffinityWorkflowService");
  queue.consume<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse>("acme.experiments.v1.ExperimentWorkflowService/AdvanceExperimentWorkflow:2", async (request) =>
    call<personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowRequest, personalizationAffinityWorkflowServiceApi.ResumeAffinityWorkflowResponse>((input, done) => client4.resumeAffinityWorkflow(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<personalizationAffinityReportingServiceApi.AffinityReportingServiceClient>("acme.personalization.v1.AffinityReportingService");
  queue.consume<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse>("acme.experiments.v1.ExposureApprovalService/ListPendingExposures:0", async (request) =>
    call<personalizationAffinityReportingServiceApi.ListAffinityReportsRequest, personalizationAffinityReportingServiceApi.ListAffinityReportsResponse>((input, done) => client5.listAffinityReports(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<communityForumValidationServiceApi.ForumValidationServiceClient>("acme.community.v1.ForumValidationService");
  queue.consume<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>("acme.experiments.v1.ExposureCalculationService/RecalculateExposures:0", async (request) =>
    call<communityForumValidationServiceApi.ExplainForumDecisionRequest, communityForumValidationServiceApi.ExplainForumDecisionResponse>((input, done) => client6.explainForumDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient>("acme.personalization.v1.ProfileApprovalService");
  queue.consume<personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest, personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse>("acme.experiments.v1.ExposureLifecycleService/ExpireExposure:1", async (request) =>
    call<personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest, personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse>((input, done) => client7.commentProfileApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<communityForumApprovalServiceApi.ForumApprovalServiceClient>("acme.community.v1.ForumApprovalService");
  queue.consume<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>("acme.experiments.v1.ExposureReportingService/ShareExposureReport:1", async (request) =>
    call<communityForumApprovalServiceApi.ListPendingForumsRequest, communityForumApprovalServiceApi.ListPendingForumsResponse>((input, done) => client8.listPendingForums(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient>("acme.personalization.v1.RecommendationValidationService");
  queue.consume<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>("acme.experiments.v1.ExposureValidationService/ExplainExposureDecision:0", async (request) =>
    call<personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionRequest, personalizationRecommendationValidationServiceApi.ExplainRecommendationDecisionResponse>((input, done) => client9.explainRecommendationDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<auditAuditEventValidationServiceApi.AuditEventValidationServiceClient>("acme.audit.v1.AuditEventValidationService");
  queue.consume<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>("acme.experiments.v1.ExposureWorkflowService/AdvanceExposureWorkflow:2", async (request) =>
    call<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>((input, done) => client10.scoreAuditEvent(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient>("acme.experiments.v1.ExperimentApprovalService");
  queue.consume<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse>("acme.experiments.v1.VariantApprovalService/DelegateVariantApproval:3", async (request) =>
    call<experimentsExperimentApprovalServiceApi.ApproveExperimentRequest, experimentsExperimentApprovalServiceApi.ApproveExperimentResponse>((input, done) => client11.approveExperiment(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<experimentsExperimentReportingServiceApi.ExperimentReportingServiceClient>("acme.experiments.v1.ExperimentReportingService");
  queue.consume<experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest, experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse>("acme.experiments.v1.VariantLifecycleService/ActivateVariant:0", async (request) =>
    call<experimentsExperimentReportingServiceApi.ScheduleExperimentReportRequest, experimentsExperimentReportingServiceApi.ScheduleExperimentReportResponse>((input, done) => client12.scheduleExperimentReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient>("acme.experiments.v1.ExposureCalculationService");
  queue.consume<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>("acme.experiments.v1.VariantQueryService/SummarizeVariants:0", async (request) =>
    call<experimentsExposureCalculationServiceApi.ExplainExposureCalculationRequest, experimentsExposureCalculationServiceApi.ExplainExposureCalculationResponse>((input, done) => client13.explainExposureCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<experimentsExperimentServiceApi.ExperimentServiceClient>("acme.experiments.v1.ExperimentService");
  queue.consume<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>("acme.experiments.v1.VariantSyncService/ListVariantConflicts:1", async (request) =>
    call<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>((input, done) => client14.listExperiments(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client15 = clients.get<toursTourQueryServiceApi.TourQueryServiceClient>("acme.tours.v1.TourQueryService");
  queue.consume<toursTourQueryServiceApi.CountToursRequest, toursTourQueryServiceApi.CountToursResponse>("acme.experiments.v1.VariantValidationService/ExplainVariantDecision:0", async (request) =>
    call<toursTourQueryServiceApi.CountToursRequest, toursTourQueryServiceApi.CountToursResponse>((input, done) => client15.countTours(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client16 = clients.get<communityBadgeApprovalServiceApi.BadgeApprovalServiceClient>("acme.community.v1.BadgeApprovalService");
  queue.consume<communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest, communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse>("acme.experiments.v1.VariantWorkflowService/ListVariantWorkflows:0", async (request) =>
    call<communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest, communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse>((input, done) => client16.commentBadgeApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
