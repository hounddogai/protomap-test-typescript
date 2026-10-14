/**
 * Register the audiences team's public gRPC boundary and workers.
 */

import * as audiencesAudienceApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as audiencesAudienceMemberCalculationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as audiencesAudienceQueryServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import * as audiencesAudienceServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as audiencesAudienceSyncApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_approval_service.js";
import * as audiencesAudienceSyncCalculationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_calculation_service.js";
import * as audiencesAudienceSyncLifecycleServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as audiencesAudienceSyncValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as audiencesAudienceWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as chatHandoffApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as communityModerationValidationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as identityUserQueryServiceApi from "../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as identityUserServiceApi from "../../../.cache/proto/acme/identity/v1/user_service.js";
import * as localizationTranslationJobApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  AudienceMemberCalculationHandler,
  implementation as bindAudienceMemberCalculationHandler,
} from "./features/audience-member/audience-member-calculation.handler.js";
import {
  AudienceMemberWorkflowHandler,
  implementation as bindAudienceMemberWorkflowHandler,
} from "./features/audience-member/audience-member-workflow.handler.js";
import {
  AudienceSyncApprovalHandler,
  implementation as bindAudienceSyncApprovalHandler,
} from "./features/audience-sync/audience-sync-approval.handler.js";
import {
  AudienceSyncValidationHandler,
  implementation as bindAudienceSyncValidationHandler,
} from "./features/audience-sync/audience-sync-validation.handler.js";
import {
  AudienceWorkflowHandler,
  implementation as bindAudienceWorkflowHandler,
} from "./features/audience/audience-workflow.handler.js";
import {
  AudienceMemberApprovalHandler,
  implementation as bindAudienceMemberApprovalHandler,
} from "./services/audience-member-approval.js";
import {
  AudienceMemberValidationHandler,
  implementation as bindAudienceMemberValidationHandler,
} from "./services/audience-member-validation.js";
import {
  AudienceSyncLifecycleHandler,
  implementation as bindAudienceSyncLifecycleHandler,
} from "./services/audience-sync-lifecycle.js";
import {
  AudienceValidationHandler,
  implementation as bindAudienceValidationHandler,
} from "./services/audience-validation.js";
import { AudienceHandler, implementation as bindAudienceHandler } from "./services/audience.js";
import {
  AudienceApprovalHandler,
  implementation as bindAudienceApprovalHandler,
} from "./transport/audience-approval.js";
import {
  AudienceMemberQueryHandler,
  implementation as bindAudienceMemberQueryHandler,
} from "./transport/audience-member-query.js";
import { AudienceQueryHandler, implementation as bindAudienceQueryHandler } from "./transport/audience-query.js";
import {
  AudienceSyncCalculationHandler,
  implementation as bindAudienceSyncCalculationHandler,
} from "./transport/audience-sync-calculation.js";
import {
  AudienceSyncWorkflowHandler,
  implementation as bindAudienceSyncWorkflowHandler,
} from "./transport/audience-sync-workflow.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(audiencesAudienceApprovalServiceApi.AudienceApprovalServiceService, bindAudienceApprovalHandler(scope.resolve(AudienceApprovalHandler)));
  server.addService(audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceService, bindAudienceMemberApprovalHandler(scope.resolve(AudienceMemberApprovalHandler)));
  server.addService(audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceService, bindAudienceMemberCalculationHandler(scope.resolve(AudienceMemberCalculationHandler)));
  server.addService(audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceService, bindAudienceMemberQueryHandler(scope.resolve(AudienceMemberQueryHandler)));
  server.addService(audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceService, bindAudienceMemberValidationHandler(scope.resolve(AudienceMemberValidationHandler)));
  server.addService(audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceService, bindAudienceMemberWorkflowHandler(scope.resolve(AudienceMemberWorkflowHandler)));
  server.addService(audiencesAudienceQueryServiceApi.AudienceQueryServiceService, bindAudienceQueryHandler(scope.resolve(AudienceQueryHandler)));
  server.addService(audiencesAudienceServiceApi.AudienceServiceService, bindAudienceHandler(scope.resolve(AudienceHandler)));
  server.addService(audiencesAudienceSyncApprovalServiceApi.AudienceSyncApprovalServiceService, bindAudienceSyncApprovalHandler(scope.resolve(AudienceSyncApprovalHandler)));
  server.addService(audiencesAudienceSyncCalculationServiceApi.AudienceSyncCalculationServiceService, bindAudienceSyncCalculationHandler(scope.resolve(AudienceSyncCalculationHandler)));
  server.addService(audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceService, bindAudienceSyncLifecycleHandler(scope.resolve(AudienceSyncLifecycleHandler)));
  server.addService(audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceService, bindAudienceSyncValidationHandler(scope.resolve(AudienceSyncValidationHandler)));
  server.addService(audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceService, bindAudienceSyncWorkflowHandler(scope.resolve(AudienceSyncWorkflowHandler)));
  server.addService(audiencesAudienceValidationServiceApi.AudienceValidationServiceService, bindAudienceValidationHandler(scope.resolve(AudienceValidationHandler)));
  server.addService(audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceService, bindAudienceWorkflowHandler(scope.resolve(AudienceWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<audiencesAudienceQueryServiceApi.AudienceQueryServiceClient>("acme.audiences.v1.AudienceQueryService");
  queue.consume<audiencesAudienceQueryServiceApi.CountAudiencesRequest, audiencesAudienceQueryServiceApi.CountAudiencesResponse>("acme.audiences.v1.AudienceMemberApprovalService/CommentAudienceMemberApproval:0", async (request) =>
    call<audiencesAudienceQueryServiceApi.CountAudiencesRequest, audiencesAudienceQueryServiceApi.CountAudiencesResponse>((input, done) => client0.countAudiences(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient>("acme.media.v1.MediaAssetValidationService");
  queue.consume<mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest, mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse>("acme.audiences.v1.AudienceMemberCalculationService/CalculateAudienceMember:1", async (request) =>
    call<mediaMediaAssetValidationServiceApi.LintMediaAssetsRequest, mediaMediaAssetValidationServiceApi.LintMediaAssetsResponse>((input, done) => client1.lintMediaAssets(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<communityModerationValidationServiceApi.ModerationValidationServiceClient>("acme.community.v1.ModerationValidationService");
  queue.consume<communityModerationValidationServiceApi.ScoreModerationRequest, communityModerationValidationServiceApi.ScoreModerationResponse>("acme.audiences.v1.AudienceMemberQueryService/ExportAudienceMembers:3", async (request) =>
    call<communityModerationValidationServiceApi.ScoreModerationRequest, communityModerationValidationServiceApi.ScoreModerationResponse>((input, done) => client2.scoreModeration(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<audiencesAudienceValidationServiceApi.AudienceValidationServiceClient>("acme.audiences.v1.AudienceValidationService");
  queue.consume<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>("acme.audiences.v1.AudienceMemberValidationService/PreviewAudienceMember:0", async (request) =>
    call<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>((input, done) => client3.lintAudiences(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<identityUserServiceApi.UserServiceClient>("acme.identity.v1.UserService");
  queue.consume<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>("acme.audiences.v1.AudienceMemberWorkflowService/SignalAudienceMemberWorkflow:0", async (request) =>
    call<identityUserServiceApi.SearchUsersRequest, identityUserServiceApi.SearchUsersResponse>((input, done) => client4.searchUsers(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<audiencesAudienceQueryServiceApi.AudienceQueryServiceClient>("acme.audiences.v1.AudienceQueryService");
  queue.consume<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>("acme.audiences.v1.AudienceService/CloneAudience:0", async (request) =>
    call<audiencesAudienceQueryServiceApi.BrowseAudiencesRequest, audiencesAudienceQueryServiceApi.BrowseAudiencesResponse>((input, done) => client5.browseAudiences(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient>("acme.audiences.v1.AudienceWorkflowService");
  queue.consume<audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest, audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse>("acme.audiences.v1.AudienceSyncApprovalService/DelegateAudienceSyncApproval:0", async (request) =>
    call<audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsRequest, audiencesAudienceWorkflowServiceApi.ListAudienceWorkflowsResponse>((input, done) => client6.listAudienceWorkflows(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient>("acme.metrics.v1.MetricSeriesValidationService");
  queue.consume<metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesResponse>("acme.audiences.v1.AudienceSyncCalculationService/ExplainAudienceSyncCalculation:0", async (request) =>
    call<metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesRequest, metricsMetricSeriesValidationServiceApi.ScoreMetricSeriesResponse>((input, done) => client7.scoreMetricSeries(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<identityUserQueryServiceApi.UserQueryServiceClient>("acme.identity.v1.UserQueryService");
  queue.consume<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>("acme.audiences.v1.AudienceSyncLifecycleService/SuspendAudienceSync:0", async (request) =>
    call<identityUserQueryServiceApi.LookupUserRequest, identityUserQueryServiceApi.LookupUserResponse>((input, done) => client8.lookupUser(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<chatHandoffApprovalServiceApi.HandoffApprovalServiceClient>("acme.chat.v1.HandoffApprovalService");
  queue.consume<chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest, chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse>("acme.audiences.v1.AudienceSyncWorkflowService/AdvanceAudienceSyncWorkflow:1", async (request) =>
    call<chatHandoffApprovalServiceApi.CommentHandoffApprovalRequest, chatHandoffApprovalServiceApi.CommentHandoffApprovalResponse>((input, done) => client9.commentHandoffApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceClient>("acme.notifications.v1.DeliveryAttemptHistoryService");
  queue.consume<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>("acme.audiences.v1.AudienceValidationService/GetAudienceRules:0", async (request) =>
    call<notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptRequest, notificationsDeliveryAttemptHistoryServiceApi.RevertDeliveryAttemptResponse>((input, done) => client10.revertDeliveryAttempt(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient>("acme.localization.v1.TranslationJobApprovalService");
  queue.consume<localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest, localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse>("acme.audiences.v1.AudienceWorkflowService/SignalAudienceWorkflow:0", async (request) =>
    call<localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsRequest, localizationTranslationJobApprovalServiceApi.ListPendingTranslationJobsResponse>((input, done) => client11.listPendingTranslationJobs(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
