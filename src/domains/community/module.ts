/**
 * Register the community team's public gRPC boundary and workers.
 */

import * as auditAuditEventValidationServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as authorizationAccessPolicyQueryServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityBadgeApprovalServiceApi from "../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityBadgeLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as communityBadgeValidationServiceApi from "../../../.cache/proto/acme/community/v1/badge_validation_service.js";
import * as communityBadgeWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/badge_workflow_service.js";
import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as communityForumQueryServiceApi from "../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumServiceApi from "../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityForumValidationServiceApi from "../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityForumWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityModerationApprovalServiceApi from "../../../.cache/proto/acme/community/v1/moderation_approval_service.js";
import * as communityModerationCalculationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityModerationLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as communityModerationValidationServiceApi from "../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostApprovalServiceApi from "../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as communityPostCalculationServiceApi from "../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostQueryServiceApi from "../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as communityPostWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as customersConsentRecordCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/consent_record_calculation_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webhooksWebhookSecretValidationServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_validation_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  BadgeCalculationHandler,
  implementation as bindBadgeCalculationHandler,
} from "./features/badge/badge-calculation.handler.js";
import {
  BadgeWorkflowHandler,
  implementation as bindBadgeWorkflowHandler,
} from "./features/badge/badge-workflow.handler.js";
import { ForumHandler, implementation as bindForumHandler } from "./features/forum/forum.handler.js";
import {
  ModerationApprovalHandler,
  implementation as bindModerationApprovalHandler,
} from "./features/moderation/moderation-approval.handler.js";
import {
  ModerationValidationHandler,
  implementation as bindModerationValidationHandler,
} from "./features/moderation/moderation-validation.handler.js";
import { PostQueryHandler, implementation as bindPostQueryHandler } from "./features/post/post-query.handler.js";
import { BadgeApprovalHandler, implementation as bindBadgeApprovalHandler } from "./services/badge-approval.js";
import { BadgeValidationHandler, implementation as bindBadgeValidationHandler } from "./services/badge-validation.js";
import { ForumQueryHandler, implementation as bindForumQueryHandler } from "./services/forum-query.js";
import { ForumWorkflowHandler, implementation as bindForumWorkflowHandler } from "./services/forum-workflow.js";
import {
  ModerationLifecycleHandler,
  implementation as bindModerationLifecycleHandler,
} from "./services/moderation-lifecycle.js";
import { PostCalculationHandler, implementation as bindPostCalculationHandler } from "./services/post-calculation.js";
import { PostWorkflowHandler, implementation as bindPostWorkflowHandler } from "./services/post-workflow.js";
import { BadgeLifecycleHandler, implementation as bindBadgeLifecycleHandler } from "./transport/badge-lifecycle.js";
import { ForumApprovalHandler, implementation as bindForumApprovalHandler } from "./transport/forum-approval.js";
import { ForumValidationHandler, implementation as bindForumValidationHandler } from "./transport/forum-validation.js";
import {
  ModerationCalculationHandler,
  implementation as bindModerationCalculationHandler,
} from "./transport/moderation-calculation.js";
import { PostApprovalHandler, implementation as bindPostApprovalHandler } from "./transport/post-approval.js";
import { PostValidationHandler, implementation as bindPostValidationHandler } from "./transport/post-validation.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(communityBadgeApprovalServiceApi.BadgeApprovalServiceService, bindBadgeApprovalHandler(scope.resolve(BadgeApprovalHandler)));
  server.addService(communityBadgeCalculationServiceApi.BadgeCalculationServiceService, bindBadgeCalculationHandler(scope.resolve(BadgeCalculationHandler)));
  server.addService(communityBadgeLifecycleServiceApi.BadgeLifecycleServiceService, bindBadgeLifecycleHandler(scope.resolve(BadgeLifecycleHandler)));
  server.addService(communityBadgeValidationServiceApi.BadgeValidationServiceService, bindBadgeValidationHandler(scope.resolve(BadgeValidationHandler)));
  server.addService(communityBadgeWorkflowServiceApi.BadgeWorkflowServiceService, bindBadgeWorkflowHandler(scope.resolve(BadgeWorkflowHandler)));
  server.addService(communityForumApprovalServiceApi.ForumApprovalServiceService, bindForumApprovalHandler(scope.resolve(ForumApprovalHandler)));
  server.addService(communityForumQueryServiceApi.ForumQueryServiceService, bindForumQueryHandler(scope.resolve(ForumQueryHandler)));
  server.addService(communityForumServiceApi.ForumServiceService, bindForumHandler(scope.resolve(ForumHandler)));
  server.addService(communityForumValidationServiceApi.ForumValidationServiceService, bindForumValidationHandler(scope.resolve(ForumValidationHandler)));
  server.addService(communityForumWorkflowServiceApi.ForumWorkflowServiceService, bindForumWorkflowHandler(scope.resolve(ForumWorkflowHandler)));
  server.addService(communityModerationApprovalServiceApi.ModerationApprovalServiceService, bindModerationApprovalHandler(scope.resolve(ModerationApprovalHandler)));
  server.addService(communityModerationCalculationServiceApi.ModerationCalculationServiceService, bindModerationCalculationHandler(scope.resolve(ModerationCalculationHandler)));
  server.addService(communityModerationLifecycleServiceApi.ModerationLifecycleServiceService, bindModerationLifecycleHandler(scope.resolve(ModerationLifecycleHandler)));
  server.addService(communityModerationValidationServiceApi.ModerationValidationServiceService, bindModerationValidationHandler(scope.resolve(ModerationValidationHandler)));
  server.addService(communityPostApprovalServiceApi.PostApprovalServiceService, bindPostApprovalHandler(scope.resolve(PostApprovalHandler)));
  server.addService(communityPostCalculationServiceApi.PostCalculationServiceService, bindPostCalculationHandler(scope.resolve(PostCalculationHandler)));
  server.addService(communityPostQueryServiceApi.PostQueryServiceService, bindPostQueryHandler(scope.resolve(PostQueryHandler)));
  server.addService(communityPostValidationServiceApi.PostValidationServiceService, bindPostValidationHandler(scope.resolve(PostValidationHandler)));
  server.addService(communityPostWorkflowServiceApi.PostWorkflowServiceService, bindPostWorkflowHandler(scope.resolve(PostWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient>("acme.authorization.v1.AccessPolicyQueryService");
  queue.consume<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>("acme.community.v1.BadgeCalculationService/EstimateBadge:0", async (request) =>
    call<authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.FindAccessPoliciesResponse>((input, done) => client0.findAccessPolicies(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<customersConsentRecordCalculationServiceApi.ConsentRecordCalculationServiceClient>("acme.customers.v1.ConsentRecordCalculationService");
  queue.consume<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>("acme.community.v1.BadgeLifecycleService/ScheduleBadgeExpiry:0", async (request) =>
    call<customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsRequest, customersConsentRecordCalculationServiceApi.RecalculateConsentRecordsResponse>((input, done) => client1.recalculateConsentRecords(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<venuesVenueValidationServiceApi.VenueValidationServiceClient>("acme.venues.v1.VenueValidationService");
  queue.consume<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>("acme.community.v1.BadgeValidationService/NormalizeBadge:1", async (request) =>
    call<venuesVenueValidationServiceApi.CheckVenueEligibilityRequest, venuesVenueValidationServiceApi.CheckVenueEligibilityResponse>((input, done) => client2.checkVenueEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<webhooksWebhookSecretValidationServiceApi.WebhookSecretValidationServiceClient>("acme.webhooks.v1.WebhookSecretValidationService");
  queue.consume<webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse>("acme.community.v1.BadgeWorkflowService/SignalBadgeWorkflow:3", async (request) =>
    call<webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretRequest, webhooksWebhookSecretValidationServiceApi.NormalizeWebhookSecretResponse>((input, done) => client3.normalizeWebhookSecret(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<communityPostValidationServiceApi.PostValidationServiceClient>("acme.community.v1.PostValidationService");
  queue.consume<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>("acme.community.v1.ForumQueryService/BrowseForums:0", async (request) =>
    call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>((input, done) => client4.normalizePost(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient>("acme.notifications.v1.NotificationCalculationService");
  queue.consume<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>("acme.community.v1.ForumService/WatchForums:0", async (request) =>
    call<notificationsNotificationCalculationServiceApi.RecalculateNotificationsRequest, notificationsNotificationCalculationServiceApi.RecalculateNotificationsResponse>((input, done) => client5.recalculateNotifications(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<communityBadgeCalculationServiceApi.BadgeCalculationServiceClient>("acme.community.v1.BadgeCalculationService");
  queue.consume<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>("acme.community.v1.ForumWorkflowService/InspectForumWorkflow:0", async (request) =>
    call<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>((input, done) => client6.recalculateBadges(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<communityPostWorkflowServiceApi.PostWorkflowServiceClient>("acme.community.v1.PostWorkflowService");
  queue.consume<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>("acme.community.v1.ModerationApprovalService/CommentModerationApproval:1", async (request) =>
    call<communityPostWorkflowServiceApi.AdvancePostWorkflowRequest, communityPostWorkflowServiceApi.AdvancePostWorkflowResponse>((input, done) => client7.advancePostWorkflow(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<auditAuditEventValidationServiceApi.AuditEventValidationServiceClient>("acme.audit.v1.AuditEventValidationService");
  queue.consume<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>("acme.community.v1.ModerationCalculationService/EstimateModeration:1", async (request) =>
    call<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>((input, done) => client8.scoreAuditEvent(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient>("acme.messaging.v1.ChatMessageCalculationService");
  queue.consume<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>("acme.community.v1.ModerationLifecycleService/SuspendModeration:0", async (request) =>
    call<messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsRequest, messagingChatMessageCalculationServiceApi.CompareChatMessageOptionsResponse>((input, done) => client9.compareChatMessageOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<communityPostValidationServiceApi.PostValidationServiceClient>("acme.community.v1.PostValidationService");
  queue.consume<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse>("acme.community.v1.ModerationValidationService/ValidateModeration:0", async (request) =>
    call<communityPostValidationServiceApi.ExplainPostDecisionRequest, communityPostValidationServiceApi.ExplainPostDecisionResponse>((input, done) => client10.explainPostDecision(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient>("acme.ledger.v1.LedgerAccountValidationService");
  queue.consume<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>("acme.community.v1.PostCalculationService/GetPostRates:0", async (request) =>
    call<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>((input, done) => client11.normalizeLedgerAccount(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<communityPostCalculationServiceApi.PostCalculationServiceClient>("acme.community.v1.PostCalculationService");
  queue.consume<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>("acme.community.v1.PostValidationService/ExplainPostDecision:3", async (request) =>
    call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>((input, done) => client12.simulatePost(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<communityPostValidationServiceApi.PostValidationServiceClient>("acme.community.v1.PostValidationService");
  queue.consume<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>("acme.community.v1.PostWorkflowService/CancelPostWorkflow:2", async (request) =>
    call<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>((input, done) => client13.validatePost(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
