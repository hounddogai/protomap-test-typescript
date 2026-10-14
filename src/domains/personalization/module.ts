/**
 * Register the personalization team's public gRPC boundary and workers.
 */

import * as communityBadgeValidationServiceApi from "../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityForumServiceApi from "../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityPostCalculationServiceApi from "../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as personalizationAffinityApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_approval_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinityImportServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinityLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationAffinityWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_workflow_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as personalizationProfileQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as personalizationProfileReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationProfileServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationProfileValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_approval_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  AffinityApprovalHandler,
  implementation as bindAffinityApprovalHandler,
} from "./features/affinity/affinity-approval.handler.js";
import {
  AffinityLifecycleHandler,
  implementation as bindAffinityLifecycleHandler,
} from "./features/affinity/affinity-lifecycle.handler.js";
import {
  AffinityValidationHandler,
  implementation as bindAffinityValidationHandler,
} from "./features/affinity/affinity-validation.handler.js";
import {
  ProfileCalculationHandler,
  implementation as bindProfileCalculationHandler,
} from "./features/profile/profile-calculation.handler.js";
import {
  ProfileReportingHandler,
  implementation as bindProfileReportingHandler,
} from "./features/profile/profile-reporting.handler.js";
import {
  ProfileWorkflowHandler,
  implementation as bindProfileWorkflowHandler,
} from "./features/profile/profile-workflow.handler.js";
import {
  RecommendationLifecycleHandler,
  implementation as bindRecommendationLifecycleHandler,
} from "./features/recommendation/recommendation-lifecycle.handler.js";
import {
  RecommendationSyncHandler,
  implementation as bindRecommendationSyncHandler,
} from "./features/recommendation/recommendation-sync.handler.js";
import { AffinityImportHandler, implementation as bindAffinityImportHandler } from "./services/affinity-import.js";
import { AffinitySyncHandler, implementation as bindAffinitySyncHandler } from "./services/affinity-sync.js";
import { ProfileApprovalHandler, implementation as bindProfileApprovalHandler } from "./services/profile-approval.js";
import { ProfileQueryHandler, implementation as bindProfileQueryHandler } from "./services/profile-query.js";
import {
  ProfileValidationHandler,
  implementation as bindProfileValidationHandler,
} from "./services/profile-validation.js";
import {
  RecommendationCalculationHandler,
  implementation as bindRecommendationCalculationHandler,
} from "./services/recommendation-calculation.js";
import {
  RecommendationReportingHandler,
  implementation as bindRecommendationReportingHandler,
} from "./services/recommendation-reporting.js";
import {
  RecommendationWorkflowHandler,
  implementation as bindRecommendationWorkflowHandler,
} from "./services/recommendation-workflow.js";
import {
  AffinityCalculationHandler,
  implementation as bindAffinityCalculationHandler,
} from "./transport/affinity-calculation.js";
import {
  AffinityReportingHandler,
  implementation as bindAffinityReportingHandler,
} from "./transport/affinity-reporting.js";
import {
  AffinityWorkflowHandler,
  implementation as bindAffinityWorkflowHandler,
} from "./transport/affinity-workflow.js";
import {
  ProfileLifecycleHandler,
  implementation as bindProfileLifecycleHandler,
} from "./transport/profile-lifecycle.js";
import { ProfileHandler, implementation as bindProfileHandler } from "./transport/profile.js";
import {
  RecommendationApprovalHandler,
  implementation as bindRecommendationApprovalHandler,
} from "./transport/recommendation-approval.js";
import {
  RecommendationQueryHandler,
  implementation as bindRecommendationQueryHandler,
} from "./transport/recommendation-query.js";
import {
  RecommendationValidationHandler,
  implementation as bindRecommendationValidationHandler,
} from "./transport/recommendation-validation.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(personalizationAffinityApprovalServiceApi.AffinityApprovalServiceService, bindAffinityApprovalHandler(scope.resolve(AffinityApprovalHandler)));
  server.addService(personalizationAffinityCalculationServiceApi.AffinityCalculationServiceService, bindAffinityCalculationHandler(scope.resolve(AffinityCalculationHandler)));
  server.addService(personalizationAffinityImportServiceApi.AffinityImportServiceService, bindAffinityImportHandler(scope.resolve(AffinityImportHandler)));
  server.addService(personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceService, bindAffinityLifecycleHandler(scope.resolve(AffinityLifecycleHandler)));
  server.addService(personalizationAffinityReportingServiceApi.AffinityReportingServiceService, bindAffinityReportingHandler(scope.resolve(AffinityReportingHandler)));
  server.addService(personalizationAffinitySyncServiceApi.AffinitySyncServiceService, bindAffinitySyncHandler(scope.resolve(AffinitySyncHandler)));
  server.addService(personalizationAffinityValidationServiceApi.AffinityValidationServiceService, bindAffinityValidationHandler(scope.resolve(AffinityValidationHandler)));
  server.addService(personalizationAffinityWorkflowServiceApi.AffinityWorkflowServiceService, bindAffinityWorkflowHandler(scope.resolve(AffinityWorkflowHandler)));
  server.addService(personalizationProfileApprovalServiceApi.ProfileApprovalServiceService, bindProfileApprovalHandler(scope.resolve(ProfileApprovalHandler)));
  server.addService(personalizationProfileCalculationServiceApi.ProfileCalculationServiceService, bindProfileCalculationHandler(scope.resolve(ProfileCalculationHandler)));
  server.addService(personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceService, bindProfileLifecycleHandler(scope.resolve(ProfileLifecycleHandler)));
  server.addService(personalizationProfileQueryServiceApi.ProfileQueryServiceService, bindProfileQueryHandler(scope.resolve(ProfileQueryHandler)));
  server.addService(personalizationProfileReportingServiceApi.ProfileReportingServiceService, bindProfileReportingHandler(scope.resolve(ProfileReportingHandler)));
  server.addService(personalizationProfileServiceApi.ProfileServiceService, bindProfileHandler(scope.resolve(ProfileHandler)));
  server.addService(personalizationProfileValidationServiceApi.ProfileValidationServiceService, bindProfileValidationHandler(scope.resolve(ProfileValidationHandler)));
  server.addService(personalizationProfileWorkflowServiceApi.ProfileWorkflowServiceService, bindProfileWorkflowHandler(scope.resolve(ProfileWorkflowHandler)));
  server.addService(personalizationRecommendationApprovalServiceApi.RecommendationApprovalServiceService, bindRecommendationApprovalHandler(scope.resolve(RecommendationApprovalHandler)));
  server.addService(personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceService, bindRecommendationCalculationHandler(scope.resolve(RecommendationCalculationHandler)));
  server.addService(personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceService, bindRecommendationLifecycleHandler(scope.resolve(RecommendationLifecycleHandler)));
  server.addService(personalizationRecommendationQueryServiceApi.RecommendationQueryServiceService, bindRecommendationQueryHandler(scope.resolve(RecommendationQueryHandler)));
  server.addService(personalizationRecommendationReportingServiceApi.RecommendationReportingServiceService, bindRecommendationReportingHandler(scope.resolve(RecommendationReportingHandler)));
  server.addService(personalizationRecommendationSyncServiceApi.RecommendationSyncServiceService, bindRecommendationSyncHandler(scope.resolve(RecommendationSyncHandler)));
  server.addService(personalizationRecommendationValidationServiceApi.RecommendationValidationServiceService, bindRecommendationValidationHandler(scope.resolve(RecommendationValidationHandler)));
  server.addService(personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceService, bindRecommendationWorkflowHandler(scope.resolve(RecommendationWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient>("acme.personalization.v1.RecommendationReportingService");
  queue.consume<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse>("acme.personalization.v1.AffinityApprovalService/ListPendingAffinities:0", async (request) =>
    call<personalizationRecommendationReportingServiceApi.ShareRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ShareRecommendationReportResponse>((input, done) => client0.shareRecommendationReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<personalizationAffinityValidationServiceApi.AffinityValidationServiceClient>("acme.personalization.v1.AffinityValidationService");
  queue.consume<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>("acme.personalization.v1.AffinityImportService/CancelAffinityImport:1", async (request) =>
    call<personalizationAffinityValidationServiceApi.LintAffinitiesRequest, personalizationAffinityValidationServiceApi.LintAffinitiesResponse>((input, done) => client1.lintAffinities(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient>("acme.personalization.v1.RecommendationSyncService");
  queue.consume<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>("acme.personalization.v1.AffinityLifecycleService/GetAffinityLifecycle:0", async (request) =>
    call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>((input, done) => client2.pushRecommendation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<personalizationAffinitySyncServiceApi.AffinitySyncServiceClient>("acme.personalization.v1.AffinitySyncService");
  queue.consume<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>("acme.personalization.v1.AffinityReportingService/GenerateAffinityReport:1", async (request) =>
    call<personalizationAffinitySyncServiceApi.ReconcileAffinitiesRequest, personalizationAffinitySyncServiceApi.ReconcileAffinitiesResponse>((input, done) => client3.reconcileAffinities(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<communityBadgeValidationServiceApi.BadgeValidationServiceClient>("acme.community.v1.BadgeValidationService");
  queue.consume<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>("acme.personalization.v1.AffinityValidationService/NormalizeAffinity:1", async (request) =>
    call<communityBadgeValidationServiceApi.LintBadgesRequest, communityBadgeValidationServiceApi.LintBadgesResponse>((input, done) => client4.lintBadges(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<personalizationAffinityImportServiceApi.AffinityImportServiceClient>("acme.personalization.v1.AffinityImportService");
  queue.consume<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>("acme.personalization.v1.ProfileApprovalService/ApproveProfile:3", async (request) =>
    call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>((input, done) => client5.listAffinityImports(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient>("acme.notifications.v1.NotificationTemplateExportService");
  queue.consume<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>("acme.personalization.v1.ProfileCalculationService/CalculateProfile:1", async (request) =>
    call<notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ScheduleNotificationTemplateExportResponse>((input, done) => client6.scheduleNotificationTemplateExport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient>("acme.personalization.v1.RecommendationQueryService");
  queue.consume<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse>("acme.personalization.v1.ProfileLifecycleService/ReinstateProfile:1", async (request) =>
    call<personalizationRecommendationQueryServiceApi.CountRecommendationsRequest, personalizationRecommendationQueryServiceApi.CountRecommendationsResponse>((input, done) => client7.countRecommendations(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<communityForumServiceApi.ForumServiceClient>("acme.community.v1.ForumService");
  queue.consume<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse>("acme.personalization.v1.ProfileQueryService/LookupProfile:1", async (request) =>
    call<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse>((input, done) => client8.updateForum(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<communityBadgeValidationServiceApi.BadgeValidationServiceClient>("acme.community.v1.BadgeValidationService");
  queue.consume<communityBadgeValidationServiceApi.NormalizeBadgeRequest, communityBadgeValidationServiceApi.NormalizeBadgeResponse>("acme.personalization.v1.ProfileService/CreateProfile:0", async (request) =>
    call<communityBadgeValidationServiceApi.NormalizeBadgeRequest, communityBadgeValidationServiceApi.NormalizeBadgeResponse>((input, done) => client9.normalizeBadge(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient>("acme.personalization.v1.ProfileCalculationService");
  queue.consume<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>("acme.personalization.v1.ProfileValidationService/PreviewProfile:0", async (request) =>
    call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>((input, done) => client10.explainProfileCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient>("acme.notifications.v1.NotificationNotificationService");
  queue.consume<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>("acme.personalization.v1.ProfileWorkflowService/SignalProfileWorkflow:0", async (request) =>
    call<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>((input, done) => client11.listNotificationSubscriptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient>("acme.personalization.v1.RecommendationReportingService");
  queue.consume<personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest, personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse>("acme.personalization.v1.RecommendationApprovalService/SubmitRecommendation:0", async (request) =>
    call<personalizationRecommendationReportingServiceApi.ListRecommendationReportsRequest, personalizationRecommendationReportingServiceApi.ListRecommendationReportsResponse>((input, done) => client12.listRecommendationReports(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<personalizationAffinityImportServiceApi.AffinityImportServiceClient>("acme.personalization.v1.AffinityImportService");
  queue.consume<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>("acme.personalization.v1.RecommendationLifecycleService/ExpireRecommendation:0", async (request) =>
    call<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>((input, done) => client13.listAffinityImports(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<personalizationAffinityValidationServiceApi.AffinityValidationServiceClient>("acme.personalization.v1.AffinityValidationService");
  queue.consume<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>("acme.personalization.v1.RecommendationQueryService/ExportRecommendations:0", async (request) =>
    call<personalizationAffinityValidationServiceApi.ExplainAffinityDecisionRequest, personalizationAffinityValidationServiceApi.ExplainAffinityDecisionResponse>((input, done) => client14.explainAffinityDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client15 = clients.get<notificationsNotificationValidationServiceApi.NotificationValidationServiceClient>("acme.notifications.v1.NotificationValidationService");
  queue.consume<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>("acme.personalization.v1.RecommendationReportingService/StreamRecommendationMetrics:2", async (request) =>
    call<notificationsNotificationValidationServiceApi.CheckNotificationEligibilityRequest, notificationsNotificationValidationServiceApi.CheckNotificationEligibilityResponse>((input, done) => client15.checkNotificationEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client16 = clients.get<communityPostCalculationServiceApi.PostCalculationServiceClient>("acme.community.v1.PostCalculationService");
  queue.consume<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>("acme.personalization.v1.RecommendationValidationService/CheckRecommendationEligibility:3", async (request) =>
    call<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>((input, done) => client16.estimatePost(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client17 = clients.get<personalizationProfileReportingServiceApi.ProfileReportingServiceClient>("acme.personalization.v1.ProfileReportingService");
  queue.consume<personalizationProfileReportingServiceApi.FetchProfileReportRequest, personalizationProfileReportingServiceApi.FetchProfileReportResponse>("acme.personalization.v1.RecommendationWorkflowService/CancelRecommendationWorkflow:2", async (request) =>
    call<personalizationProfileReportingServiceApi.FetchProfileReportRequest, personalizationProfileReportingServiceApi.FetchProfileReportResponse>((input, done) => client17.fetchProfileReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
