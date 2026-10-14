/**
 * Register the notifications team's public gRPC boundary and workers.
 */

import * as featureflagsFeatureFlagServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsDeliveryAttemptHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_history_service.js";
import * as notificationsDeliveryAttemptNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_notification_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsNotificationAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_admin_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as notificationsNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsNotificationTemplateNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_notification_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as notificationsSubscriptionAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_admin_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as notificationsSubscriptionExportServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_export_service.js";
import * as notificationsSubscriptionHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_history_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  DeliveryAttemptAdminHandler,
  implementation as bindDeliveryAttemptAdminHandler,
} from "./features/delivery-attempt/delivery-attempt-admin.handler.js";
import {
  DeliveryAttemptHistoryHandler,
  implementation as bindDeliveryAttemptHistoryHandler,
} from "./features/delivery-attempt/delivery-attempt-history.handler.js";
import {
  DeliveryAttemptValidationHandler,
  implementation as bindDeliveryAttemptValidationHandler,
} from "./features/delivery-attempt/delivery-attempt-validation.handler.js";
import {
  NotificationTemplateExportHandler,
  implementation as bindNotificationTemplateExportHandler,
} from "./features/notification-template/notification-template-export.handler.js";
import {
  NotificationTemplateQueryHandler,
  implementation as bindNotificationTemplateQueryHandler,
} from "./features/notification-template/notification-template-query.handler.js";
import {
  NotificationCalculationHandler,
  implementation as bindNotificationCalculationHandler,
} from "./features/notification/notification-calculation.handler.js";
import {
  NotificationNotificationHandler,
  implementation as bindNotificationNotificationHandler,
} from "./features/notification/notification-notification.handler.js";
import {
  NotificationSyncHandler,
  implementation as bindNotificationSyncHandler,
} from "./features/notification/notification-sync.handler.js";
import {
  NotificationValidationHandler,
  implementation as bindNotificationValidationHandler,
} from "./features/notification/notification-validation.handler.js";
import {
  SubscriptionCalculationHandler,
  implementation as bindSubscriptionCalculationHandler,
} from "./features/subscription/subscription-calculation.handler.js";
import {
  SubscriptionNotificationHandler,
  implementation as bindSubscriptionNotificationHandler,
} from "./features/subscription/subscription-notification.handler.js";
import {
  DeliveryAttemptExportHandler,
  implementation as bindDeliveryAttemptExportHandler,
} from "./services/delivery-attempt-export.js";
import {
  DeliveryAttemptSyncHandler,
  implementation as bindDeliveryAttemptSyncHandler,
} from "./services/delivery-attempt-sync.js";
import {
  NotificationAdminHandler,
  implementation as bindNotificationAdminHandler,
} from "./services/notification-admin.js";
import {
  NotificationHistoryHandler,
  implementation as bindNotificationHistoryHandler,
} from "./services/notification-history.js";
import {
  NotificationTemplateCalculationHandler,
  implementation as bindNotificationTemplateCalculationHandler,
} from "./services/notification-template-calculation.js";
import {
  NotificationTemplateNotificationHandler,
  implementation as bindNotificationTemplateNotificationHandler,
} from "./services/notification-template-notification.js";
import {
  NotificationTemplateValidationHandler,
  implementation as bindNotificationTemplateValidationHandler,
} from "./services/notification-template-validation.js";
import { NotificationHandler, implementation as bindNotificationHandler } from "./services/notification.js";
import {
  SubscriptionApprovalHandler,
  implementation as bindSubscriptionApprovalHandler,
} from "./services/subscription-approval.js";
import {
  SubscriptionHistoryHandler,
  implementation as bindSubscriptionHistoryHandler,
} from "./services/subscription-history.js";
import {
  SubscriptionWorkflowHandler,
  implementation as bindSubscriptionWorkflowHandler,
} from "./services/subscription-workflow.js";
import {
  DeliveryAttemptCalculationHandler,
  implementation as bindDeliveryAttemptCalculationHandler,
} from "./transport/delivery-attempt-calculation.js";
import {
  DeliveryAttemptNotificationHandler,
  implementation as bindDeliveryAttemptNotificationHandler,
} from "./transport/delivery-attempt-notification.js";
import {
  DeliveryAttemptWorkflowHandler,
  implementation as bindDeliveryAttemptWorkflowHandler,
} from "./transport/delivery-attempt-workflow.js";
import {
  NotificationExportHandler,
  implementation as bindNotificationExportHandler,
} from "./transport/notification-export.js";
import {
  NotificationQueryHandler,
  implementation as bindNotificationQueryHandler,
} from "./transport/notification-query.js";
import {
  NotificationTemplateAdminHandler,
  implementation as bindNotificationTemplateAdminHandler,
} from "./transport/notification-template-admin.js";
import {
  NotificationTemplateHistoryHandler,
  implementation as bindNotificationTemplateHistoryHandler,
} from "./transport/notification-template-history.js";
import {
  NotificationTemplateSyncHandler,
  implementation as bindNotificationTemplateSyncHandler,
} from "./transport/notification-template-sync.js";
import {
  SubscriptionAdminHandler,
  implementation as bindSubscriptionAdminHandler,
} from "./transport/subscription-admin.js";
import {
  SubscriptionExportHandler,
  implementation as bindSubscriptionExportHandler,
} from "./transport/subscription-export.js";
import {
  SubscriptionSyncHandler,
  implementation as bindSubscriptionSyncHandler,
} from "./transport/subscription-sync.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceService, bindDeliveryAttemptAdminHandler(scope.resolve(DeliveryAttemptAdminHandler)));
  server.addService(notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceService, bindDeliveryAttemptCalculationHandler(scope.resolve(DeliveryAttemptCalculationHandler)));
  server.addService(notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceService, bindDeliveryAttemptExportHandler(scope.resolve(DeliveryAttemptExportHandler)));
  server.addService(notificationsDeliveryAttemptHistoryServiceApi.DeliveryAttemptHistoryServiceService, bindDeliveryAttemptHistoryHandler(scope.resolve(DeliveryAttemptHistoryHandler)));
  server.addService(notificationsDeliveryAttemptNotificationServiceApi.DeliveryAttemptNotificationServiceService, bindDeliveryAttemptNotificationHandler(scope.resolve(DeliveryAttemptNotificationHandler)));
  server.addService(notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceService, bindDeliveryAttemptSyncHandler(scope.resolve(DeliveryAttemptSyncHandler)));
  server.addService(notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceService, bindDeliveryAttemptValidationHandler(scope.resolve(DeliveryAttemptValidationHandler)));
  server.addService(notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceService, bindDeliveryAttemptWorkflowHandler(scope.resolve(DeliveryAttemptWorkflowHandler)));
  server.addService(notificationsNotificationAdminServiceApi.NotificationAdminServiceService, bindNotificationAdminHandler(scope.resolve(NotificationAdminHandler)));
  server.addService(notificationsNotificationCalculationServiceApi.NotificationCalculationServiceService, bindNotificationCalculationHandler(scope.resolve(NotificationCalculationHandler)));
  server.addService(notificationsNotificationExportServiceApi.NotificationExportServiceService, bindNotificationExportHandler(scope.resolve(NotificationExportHandler)));
  server.addService(notificationsNotificationHistoryServiceApi.NotificationHistoryServiceService, bindNotificationHistoryHandler(scope.resolve(NotificationHistoryHandler)));
  server.addService(notificationsNotificationNotificationServiceApi.NotificationNotificationServiceService, bindNotificationNotificationHandler(scope.resolve(NotificationNotificationHandler)));
  server.addService(notificationsNotificationQueryServiceApi.NotificationQueryServiceService, bindNotificationQueryHandler(scope.resolve(NotificationQueryHandler)));
  server.addService(notificationsNotificationServiceApi.NotificationServiceService, bindNotificationHandler(scope.resolve(NotificationHandler)));
  server.addService(notificationsNotificationSyncServiceApi.NotificationSyncServiceService, bindNotificationSyncHandler(scope.resolve(NotificationSyncHandler)));
  server.addService(notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceService, bindNotificationTemplateAdminHandler(scope.resolve(NotificationTemplateAdminHandler)));
  server.addService(notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceService, bindNotificationTemplateCalculationHandler(scope.resolve(NotificationTemplateCalculationHandler)));
  server.addService(notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceService, bindNotificationTemplateExportHandler(scope.resolve(NotificationTemplateExportHandler)));
  server.addService(notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceService, bindNotificationTemplateHistoryHandler(scope.resolve(NotificationTemplateHistoryHandler)));
  server.addService(notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceService, bindNotificationTemplateNotificationHandler(scope.resolve(NotificationTemplateNotificationHandler)));
  server.addService(notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceService, bindNotificationTemplateQueryHandler(scope.resolve(NotificationTemplateQueryHandler)));
  server.addService(notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceService, bindNotificationTemplateSyncHandler(scope.resolve(NotificationTemplateSyncHandler)));
  server.addService(notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceService, bindNotificationTemplateValidationHandler(scope.resolve(NotificationTemplateValidationHandler)));
  server.addService(notificationsNotificationValidationServiceApi.NotificationValidationServiceService, bindNotificationValidationHandler(scope.resolve(NotificationValidationHandler)));
  server.addService(notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceService, bindSubscriptionAdminHandler(scope.resolve(SubscriptionAdminHandler)));
  server.addService(notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceService, bindSubscriptionApprovalHandler(scope.resolve(SubscriptionApprovalHandler)));
  server.addService(notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceService, bindSubscriptionCalculationHandler(scope.resolve(SubscriptionCalculationHandler)));
  server.addService(notificationsSubscriptionExportServiceApi.SubscriptionExportServiceService, bindSubscriptionExportHandler(scope.resolve(SubscriptionExportHandler)));
  server.addService(notificationsSubscriptionHistoryServiceApi.SubscriptionHistoryServiceService, bindSubscriptionHistoryHandler(scope.resolve(SubscriptionHistoryHandler)));
  server.addService(notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceService, bindSubscriptionNotificationHandler(scope.resolve(SubscriptionNotificationHandler)));
  server.addService(notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceService, bindSubscriptionSyncHandler(scope.resolve(SubscriptionSyncHandler)));
  server.addService(notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceService, bindSubscriptionWorkflowHandler(scope.resolve(SubscriptionWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<notificationsNotificationTemplateNotificationServiceApi.NotificationTemplateNotificationServiceClient>("acme.notifications.v1.NotificationTemplateNotificationService");
  queue.consume<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse>("acme.notifications.v1.DeliveryAttemptNotificationService/NotifyDeliveryAttemptWatchers:0", async (request) =>
    call<notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesRequest, notificationsNotificationTemplateNotificationServiceApi.SubscribeNotificationTemplateUpdatesResponse>((input, done) => client0.subscribeNotificationTemplateUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient>("acme.notifications.v1.SubscriptionApprovalService");
  queue.consume<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>("acme.notifications.v1.NotificationTemplateAdminService/ReassignNotificationTemplate:0", async (request) =>
    call<notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.DelegateSubscriptionApprovalResponse>((input, done) => client1.delegateSubscriptionApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient>("acme.featureflags.v1.FeatureFlagService");
  queue.consume<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse>("acme.notifications.v1.SubscriptionExportService/ShareSubscriptionExport:0", async (request) =>
    call<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse>((input, done) => client2.batchGetFeatureFlags(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
