/**
 * Register the media team's public gRPC boundary and workers.
 */

import * as chatChatRoomServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as customersCustomerCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdCalculationServiceApi from "../../../.cache/proto/acme/customers/v1/household_calculation_service.js";
import * as identityUserValidationServiceApi from "../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as mediaMediaAssetApprovalServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_approval_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as mediaMediaAssetQueryServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_query_service.js";
import * as mediaMediaAssetReportingServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_reporting_service.js";
import * as mediaMediaAssetServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaMediaAssetSyncServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_sync_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import * as mediaMediaAssetWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_workflow_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/rendition_lifecycle_service.js";
import * as mediaRenditionQueryServiceApi from "../../../.cache/proto/acme/media/v1/rendition_query_service.js";
import * as mediaRenditionReportingServiceApi from "../../../.cache/proto/acme/media/v1/rendition_reporting_service.js";
import * as mediaRenditionSyncServiceApi from "../../../.cache/proto/acme/media/v1/rendition_sync_service.js";
import * as mediaRenditionValidationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as mediaRenditionWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/rendition_workflow_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import * as mediaTranscodeJobImportServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_import_service.js";
import * as mediaTranscodeJobLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_lifecycle_service.js";
import * as mediaTranscodeJobReportingServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_reporting_service.js";
import * as mediaTranscodeJobSyncServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_sync_service.js";
import * as mediaTranscodeJobValidationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_validation_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import * as prescriptionsPrescriptionCalculationServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_calculation_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import * as webhooksWebhookDeliveryApprovalServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_approval_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  MediaAssetCalculationHandler,
  implementation as bindMediaAssetCalculationHandler,
} from "./features/media-asset/media-asset-calculation.handler.js";
import {
  MediaAssetReportingHandler,
  implementation as bindMediaAssetReportingHandler,
} from "./features/media-asset/media-asset-reporting.handler.js";
import {
  MediaAssetValidationHandler,
  implementation as bindMediaAssetValidationHandler,
} from "./features/media-asset/media-asset-validation.handler.js";
import {
  RenditionCalculationHandler,
  implementation as bindRenditionCalculationHandler,
} from "./features/rendition/rendition-calculation.handler.js";
import {
  RenditionReportingHandler,
  implementation as bindRenditionReportingHandler,
} from "./features/rendition/rendition-reporting.handler.js";
import {
  RenditionWorkflowHandler,
  implementation as bindRenditionWorkflowHandler,
} from "./features/rendition/rendition-workflow.handler.js";
import {
  TranscodeJobImportHandler,
  implementation as bindTranscodeJobImportHandler,
} from "./features/transcode-job/transcode-job-import.handler.js";
import {
  TranscodeJobSyncHandler,
  implementation as bindTranscodeJobSyncHandler,
} from "./features/transcode-job/transcode-job-sync.handler.js";
import {
  MediaAssetApprovalHandler,
  implementation as bindMediaAssetApprovalHandler,
} from "./services/media-asset-approval.js";
import { MediaAssetQueryHandler, implementation as bindMediaAssetQueryHandler } from "./services/media-asset-query.js";
import { MediaAssetSyncHandler, implementation as bindMediaAssetSyncHandler } from "./services/media-asset-sync.js";
import {
  RenditionApprovalHandler,
  implementation as bindRenditionApprovalHandler,
} from "./services/rendition-approval.js";
import { RenditionQueryHandler, implementation as bindRenditionQueryHandler } from "./services/rendition-query.js";
import {
  RenditionValidationHandler,
  implementation as bindRenditionValidationHandler,
} from "./services/rendition-validation.js";
import {
  TranscodeJobCalculationHandler,
  implementation as bindTranscodeJobCalculationHandler,
} from "./services/transcode-job-calculation.js";
import {
  TranscodeJobReportingHandler,
  implementation as bindTranscodeJobReportingHandler,
} from "./services/transcode-job-reporting.js";
import {
  TranscodeJobWorkflowHandler,
  implementation as bindTranscodeJobWorkflowHandler,
} from "./services/transcode-job-workflow.js";
import {
  MediaAssetLifecycleHandler,
  implementation as bindMediaAssetLifecycleHandler,
} from "./transport/media-asset-lifecycle.js";
import {
  MediaAssetWorkflowHandler,
  implementation as bindMediaAssetWorkflowHandler,
} from "./transport/media-asset-workflow.js";
import { MediaAssetHandler, implementation as bindMediaAssetHandler } from "./transport/media-asset.js";
import {
  RenditionLifecycleHandler,
  implementation as bindRenditionLifecycleHandler,
} from "./transport/rendition-lifecycle.js";
import { RenditionSyncHandler, implementation as bindRenditionSyncHandler } from "./transport/rendition-sync.js";
import {
  TranscodeJobApprovalHandler,
  implementation as bindTranscodeJobApprovalHandler,
} from "./transport/transcode-job-approval.js";
import {
  TranscodeJobLifecycleHandler,
  implementation as bindTranscodeJobLifecycleHandler,
} from "./transport/transcode-job-lifecycle.js";
import {
  TranscodeJobValidationHandler,
  implementation as bindTranscodeJobValidationHandler,
} from "./transport/transcode-job-validation.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(mediaMediaAssetApprovalServiceApi.MediaAssetApprovalServiceService, bindMediaAssetApprovalHandler(scope.resolve(MediaAssetApprovalHandler)));
  server.addService(mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceService, bindMediaAssetCalculationHandler(scope.resolve(MediaAssetCalculationHandler)));
  server.addService(mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceService, bindMediaAssetLifecycleHandler(scope.resolve(MediaAssetLifecycleHandler)));
  server.addService(mediaMediaAssetQueryServiceApi.MediaAssetQueryServiceService, bindMediaAssetQueryHandler(scope.resolve(MediaAssetQueryHandler)));
  server.addService(mediaMediaAssetReportingServiceApi.MediaAssetReportingServiceService, bindMediaAssetReportingHandler(scope.resolve(MediaAssetReportingHandler)));
  server.addService(mediaMediaAssetServiceApi.MediaAssetServiceService, bindMediaAssetHandler(scope.resolve(MediaAssetHandler)));
  server.addService(mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceService, bindMediaAssetSyncHandler(scope.resolve(MediaAssetSyncHandler)));
  server.addService(mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceService, bindMediaAssetValidationHandler(scope.resolve(MediaAssetValidationHandler)));
  server.addService(mediaMediaAssetWorkflowServiceApi.MediaAssetWorkflowServiceService, bindMediaAssetWorkflowHandler(scope.resolve(MediaAssetWorkflowHandler)));
  server.addService(mediaRenditionApprovalServiceApi.RenditionApprovalServiceService, bindRenditionApprovalHandler(scope.resolve(RenditionApprovalHandler)));
  server.addService(mediaRenditionCalculationServiceApi.RenditionCalculationServiceService, bindRenditionCalculationHandler(scope.resolve(RenditionCalculationHandler)));
  server.addService(mediaRenditionLifecycleServiceApi.RenditionLifecycleServiceService, bindRenditionLifecycleHandler(scope.resolve(RenditionLifecycleHandler)));
  server.addService(mediaRenditionQueryServiceApi.RenditionQueryServiceService, bindRenditionQueryHandler(scope.resolve(RenditionQueryHandler)));
  server.addService(mediaRenditionReportingServiceApi.RenditionReportingServiceService, bindRenditionReportingHandler(scope.resolve(RenditionReportingHandler)));
  server.addService(mediaRenditionSyncServiceApi.RenditionSyncServiceService, bindRenditionSyncHandler(scope.resolve(RenditionSyncHandler)));
  server.addService(mediaRenditionValidationServiceApi.RenditionValidationServiceService, bindRenditionValidationHandler(scope.resolve(RenditionValidationHandler)));
  server.addService(mediaRenditionWorkflowServiceApi.RenditionWorkflowServiceService, bindRenditionWorkflowHandler(scope.resolve(RenditionWorkflowHandler)));
  server.addService(mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceService, bindTranscodeJobApprovalHandler(scope.resolve(TranscodeJobApprovalHandler)));
  server.addService(mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceService, bindTranscodeJobCalculationHandler(scope.resolve(TranscodeJobCalculationHandler)));
  server.addService(mediaTranscodeJobImportServiceApi.TranscodeJobImportServiceService, bindTranscodeJobImportHandler(scope.resolve(TranscodeJobImportHandler)));
  server.addService(mediaTranscodeJobLifecycleServiceApi.TranscodeJobLifecycleServiceService, bindTranscodeJobLifecycleHandler(scope.resolve(TranscodeJobLifecycleHandler)));
  server.addService(mediaTranscodeJobReportingServiceApi.TranscodeJobReportingServiceService, bindTranscodeJobReportingHandler(scope.resolve(TranscodeJobReportingHandler)));
  server.addService(mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceService, bindTranscodeJobSyncHandler(scope.resolve(TranscodeJobSyncHandler)));
  server.addService(mediaTranscodeJobValidationServiceApi.TranscodeJobValidationServiceService, bindTranscodeJobValidationHandler(scope.resolve(TranscodeJobValidationHandler)));
  server.addService(mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceService, bindTranscodeJobWorkflowHandler(scope.resolve(TranscodeJobWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<mediaTranscodeJobSyncServiceApi.TranscodeJobSyncServiceClient>("acme.media.v1.TranscodeJobSyncService");
  queue.consume<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>("acme.media.v1.MediaAssetApprovalService/DelegateMediaAssetApproval:0", async (request) =>
    call<mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsRequest, mediaTranscodeJobSyncServiceApi.ListTranscodeJobConflictsResponse>((input, done) => client0.listTranscodeJobConflicts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient>("acme.notifications.v1.SubscriptionNotificationService");
  queue.consume<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>("acme.media.v1.MediaAssetCalculationService/QuoteMediaAsset:2", async (request) =>
    call<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>((input, done) => client1.subscribeSubscriptionUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient>("acme.media.v1.RenditionCalculationService");
  queue.consume<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>("acme.media.v1.MediaAssetLifecycleService/TerminateMediaAsset:2", async (request) =>
    call<mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest, mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse>((input, done) => client2.recalculateRenditions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient>("acme.personalization.v1.RecommendationWorkflowService");
  queue.consume<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>("acme.media.v1.MediaAssetReportingService/ListMediaAssetReports:1", async (request) =>
    call<personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsRequest, personalizationRecommendationWorkflowServiceApi.ListRecommendationWorkflowsResponse>((input, done) => client3.listRecommendationWorkflows(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient>("acme.notifications.v1.NotificationTemplateExportService");
  queue.consume<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>("acme.media.v1.MediaAssetService/WatchMediaAssets:0", async (request) =>
    call<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>((input, done) => client4.shareNotificationTemplateExport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<identityUserValidationServiceApi.UserValidationServiceClient>("acme.identity.v1.UserValidationService");
  queue.consume<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse>("acme.media.v1.MediaAssetValidationService/ExplainMediaAssetDecision:0", async (request) =>
    call<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse>((input, done) => client5.getUserRules(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<webhooksWebhookDeliveryApprovalServiceApi.WebhookDeliveryApprovalServiceClient>("acme.webhooks.v1.WebhookDeliveryApprovalService");
  queue.consume<webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest, webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse>("acme.media.v1.MediaAssetWorkflowService/CancelMediaAssetWorkflow:0", async (request) =>
    call<webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalRequest, webhooksWebhookDeliveryApprovalServiceApi.CommentWebhookDeliveryApprovalResponse>((input, done) => client6.commentWebhookDeliveryApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<venuesVenueValidationServiceApi.VenueValidationServiceClient>("acme.venues.v1.VenueValidationService");
  queue.consume<venuesVenueValidationServiceApi.PreviewVenueRequest, venuesVenueValidationServiceApi.PreviewVenueResponse>("acme.media.v1.RenditionApprovalService/ApproveRendition:1", async (request) =>
    call<venuesVenueValidationServiceApi.PreviewVenueRequest, venuesVenueValidationServiceApi.PreviewVenueResponse>((input, done) => client7.previewVenue(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<chatChatRoomServiceApi.ChatRoomServiceClient>("acme.chat.v1.ChatRoomService");
  queue.consume<chatChatRoomServiceApi.UpdateChatRoomRequest, chatChatRoomServiceApi.UpdateChatRoomResponse>("acme.media.v1.RenditionCalculationService/CompareRenditionOptions:2", async (request) =>
    call<chatChatRoomServiceApi.UpdateChatRoomRequest, chatChatRoomServiceApi.UpdateChatRoomResponse>((input, done) => client8.updateChatRoom(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient>("acme.personalization.v1.RecommendationReportingService");
  queue.consume<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>("acme.media.v1.RenditionLifecycleService/GetRenditionLifecycle:1", async (request) =>
    call<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>((input, done) => client9.generateRecommendationReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient>("acme.prescriptions.v1.PrescriptionCalculationService");
  queue.consume<prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionResponse>("acme.media.v1.RenditionQueryService/ExportRenditions:0", async (request) =>
    call<prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.QuotePrescriptionResponse>((input, done) => client10.quotePrescription(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<customersHouseholdCalculationServiceApi.HouseholdCalculationServiceClient>("acme.customers.v1.HouseholdCalculationService");
  queue.consume<customersHouseholdCalculationServiceApi.QuoteHouseholdRequest, customersHouseholdCalculationServiceApi.QuoteHouseholdResponse>("acme.media.v1.RenditionSyncService/GetRenditionSyncState:1", async (request) =>
    call<customersHouseholdCalculationServiceApi.QuoteHouseholdRequest, customersHouseholdCalculationServiceApi.QuoteHouseholdResponse>((input, done) => client11.quoteHousehold(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient>("acme.media.v1.MediaAssetValidationService");
  queue.consume<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>("acme.media.v1.RenditionValidationService/CheckRenditionEligibility:0", async (request) =>
    call<mediaMediaAssetValidationServiceApi.ValidateMediaAssetRequest, mediaMediaAssetValidationServiceApi.ValidateMediaAssetResponse>((input, done) => client12.validateMediaAsset(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient>("acme.media.v1.RenditionCalculationService");
  queue.consume<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>("acme.media.v1.RenditionValidationService/ValidateRendition:1", async (request) =>
    call<mediaRenditionCalculationServiceApi.QuoteRenditionRequest, mediaRenditionCalculationServiceApi.QuoteRenditionResponse>((input, done) => client13.quoteRendition(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient>("acme.media.v1.MediaAssetSyncService");
  queue.consume<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>("acme.media.v1.TranscodeJobApprovalService/ApproveTranscodeJob:1", async (request) =>
    call<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>((input, done) => client14.resolveMediaAssetConflict(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client15 = clients.get<customersCustomerCalculationServiceApi.CustomerCalculationServiceClient>("acme.customers.v1.CustomerCalculationService");
  queue.consume<customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest, customersCustomerCalculationServiceApi.ExplainCustomerCalculationResponse>("acme.media.v1.TranscodeJobApprovalService/SubmitTranscodeJob:0", async (request) =>
    call<customersCustomerCalculationServiceApi.ExplainCustomerCalculationRequest, customersCustomerCalculationServiceApi.ExplainCustomerCalculationResponse>((input, done) => client15.explainCustomerCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client16 = clients.get<mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient>("acme.media.v1.MediaAssetCalculationService");
  queue.consume<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>("acme.media.v1.TranscodeJobCalculationService/SimulateTranscodeJob:1", async (request) =>
    call<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>((input, done) => client16.compareMediaAssetOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client17 = clients.get<mediaMediaAssetSyncServiceApi.MediaAssetSyncServiceClient>("acme.media.v1.MediaAssetSyncService");
  queue.consume<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>("acme.media.v1.TranscodeJobLifecycleService/ExpireTranscodeJob:1", async (request) =>
    call<mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictRequest, mediaMediaAssetSyncServiceApi.ResolveMediaAssetConflictResponse>((input, done) => client17.resolveMediaAssetConflict(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client18 = clients.get<mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient>("acme.media.v1.MediaAssetCalculationService");
  queue.consume<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>("acme.media.v1.TranscodeJobReportingService/GenerateTranscodeJobReport:2", async (request) =>
    call<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>((input, done) => client18.compareMediaAssetOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client19 = clients.get<customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient>("acme.customers.v1.CustomerSegmentValidationService");
  queue.consume<customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse>("acme.media.v1.TranscodeJobSyncService/StreamTranscodeJobChanges:1", async (request) =>
    call<customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.ValidateCustomerSegmentResponse>((input, done) => client19.validateCustomerSegment(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client20 = clients.get<mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient>("acme.media.v1.TranscodeJobCalculationService");
  queue.consume<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>("acme.media.v1.TranscodeJobValidationService/ValidateTranscodeJob:1", async (request) =>
    call<mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesRequest, mediaTranscodeJobCalculationServiceApi.GetTranscodeJobRatesResponse>((input, done) => client20.getTranscodeJobRates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
