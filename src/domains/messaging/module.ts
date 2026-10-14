/**
 * Register the messaging team's public gRPC boundary and workers.
 */

import * as auditAuditEventValidationServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as bankingBankAccountQueryServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_query_service.js";
import * as inventoryStockItemQueryServiceApi from "../../../.cache/proto/acme/inventory/v1/stock_item_query_service.js";
import * as invoicingInvoiceBatchCalculationServiceApi from "../../../.cache/proto/acme/invoicing/v1/invoice_batch_calculation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as messagingChannelApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_approval_service.js";
import * as messagingChannelCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_calculation_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as messagingChannelReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_reporting_service.js";
import * as messagingChannelSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_sync_service.js";
import * as messagingChannelValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as messagingChannelWorkflowServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_workflow_service.js";
import * as messagingChatMessageApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_approval_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as messagingChatMessageLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as messagingChatMessageQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_query_service.js";
import * as messagingChatMessageReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_reporting_service.js";
import * as messagingChatMessageSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_sync_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingChatMessageWorkflowServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_workflow_service.js";
import * as messagingConversationApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_approval_service.js";
import * as messagingConversationCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_calculation_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as messagingConversationReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_reporting_service.js";
import * as messagingConversationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_service.js";
import * as messagingConversationValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as messagingConversationWorkflowServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_workflow_service.js";
import * as messagingParticipantApprovalServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_approval_service.js";
import * as messagingParticipantCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_calculation_service.js";
import * as messagingParticipantImportServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import * as messagingParticipantReportingServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_reporting_service.js";
import * as messagingParticipantSyncServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_sync_service.js";
import * as messagingParticipantValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as notificationsNotificationExportServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_export_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  ChannelApprovalHandler,
  implementation as bindChannelApprovalHandler,
} from "./features/channel/channel-approval.handler.js";
import {
  ChannelReportingHandler,
  implementation as bindChannelReportingHandler,
} from "./features/channel/channel-reporting.handler.js";
import {
  ChannelWorkflowHandler,
  implementation as bindChannelWorkflowHandler,
} from "./features/channel/channel-workflow.handler.js";
import {
  ChatMessageLifecycleHandler,
  implementation as bindChatMessageLifecycleHandler,
} from "./features/chat-message/chat-message-lifecycle.handler.js";
import {
  ChatMessageSyncHandler,
  implementation as bindChatMessageSyncHandler,
} from "./features/chat-message/chat-message-sync.handler.js";
import {
  ConversationApprovalHandler,
  implementation as bindConversationApprovalHandler,
} from "./features/conversation/conversation-approval.handler.js";
import {
  ConversationQueryHandler,
  implementation as bindConversationQueryHandler,
} from "./features/conversation/conversation-query.handler.js";
import {
  ConversationValidationHandler,
  implementation as bindConversationValidationHandler,
} from "./features/conversation/conversation-validation.handler.js";
import {
  ParticipantCalculationHandler,
  implementation as bindParticipantCalculationHandler,
} from "./features/participant/participant-calculation.handler.js";
import {
  ParticipantReportingHandler,
  implementation as bindParticipantReportingHandler,
} from "./features/participant/participant-reporting.handler.js";
import {
  ChannelLifecycleHandler,
  implementation as bindChannelLifecycleHandler,
} from "./services/channel-lifecycle.js";
import {
  ChannelValidationHandler,
  implementation as bindChannelValidationHandler,
} from "./services/channel-validation.js";
import {
  ChatMessageCalculationHandler,
  implementation as bindChatMessageCalculationHandler,
} from "./services/chat-message-calculation.js";
import {
  ChatMessageReportingHandler,
  implementation as bindChatMessageReportingHandler,
} from "./services/chat-message-reporting.js";
import {
  ChatMessageWorkflowHandler,
  implementation as bindChatMessageWorkflowHandler,
} from "./services/chat-message-workflow.js";
import {
  ConversationLifecycleHandler,
  implementation as bindConversationLifecycleHandler,
} from "./services/conversation-lifecycle.js";
import { ConversationHandler, implementation as bindConversationHandler } from "./services/conversation.js";
import {
  ParticipantApprovalHandler,
  implementation as bindParticipantApprovalHandler,
} from "./services/participant-approval.js";
import {
  ParticipantLifecycleHandler,
  implementation as bindParticipantLifecycleHandler,
} from "./services/participant-lifecycle.js";
import {
  ParticipantValidationHandler,
  implementation as bindParticipantValidationHandler,
} from "./services/participant-validation.js";
import {
  ChannelCalculationHandler,
  implementation as bindChannelCalculationHandler,
} from "./transport/channel-calculation.js";
import { ChannelSyncHandler, implementation as bindChannelSyncHandler } from "./transport/channel-sync.js";
import {
  ChatMessageApprovalHandler,
  implementation as bindChatMessageApprovalHandler,
} from "./transport/chat-message-approval.js";
import {
  ChatMessageQueryHandler,
  implementation as bindChatMessageQueryHandler,
} from "./transport/chat-message-query.js";
import {
  ChatMessageValidationHandler,
  implementation as bindChatMessageValidationHandler,
} from "./transport/chat-message-validation.js";
import {
  ConversationCalculationHandler,
  implementation as bindConversationCalculationHandler,
} from "./transport/conversation-calculation.js";
import {
  ConversationReportingHandler,
  implementation as bindConversationReportingHandler,
} from "./transport/conversation-reporting.js";
import {
  ConversationWorkflowHandler,
  implementation as bindConversationWorkflowHandler,
} from "./transport/conversation-workflow.js";
import {
  ParticipantImportHandler,
  implementation as bindParticipantImportHandler,
} from "./transport/participant-import.js";
import { ParticipantSyncHandler, implementation as bindParticipantSyncHandler } from "./transport/participant-sync.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(messagingChannelApprovalServiceApi.ChannelApprovalServiceService, bindChannelApprovalHandler(scope.resolve(ChannelApprovalHandler)));
  server.addService(messagingChannelCalculationServiceApi.ChannelCalculationServiceService, bindChannelCalculationHandler(scope.resolve(ChannelCalculationHandler)));
  server.addService(messagingChannelLifecycleServiceApi.ChannelLifecycleServiceService, bindChannelLifecycleHandler(scope.resolve(ChannelLifecycleHandler)));
  server.addService(messagingChannelReportingServiceApi.ChannelReportingServiceService, bindChannelReportingHandler(scope.resolve(ChannelReportingHandler)));
  server.addService(messagingChannelSyncServiceApi.ChannelSyncServiceService, bindChannelSyncHandler(scope.resolve(ChannelSyncHandler)));
  server.addService(messagingChannelValidationServiceApi.ChannelValidationServiceService, bindChannelValidationHandler(scope.resolve(ChannelValidationHandler)));
  server.addService(messagingChannelWorkflowServiceApi.ChannelWorkflowServiceService, bindChannelWorkflowHandler(scope.resolve(ChannelWorkflowHandler)));
  server.addService(messagingChatMessageApprovalServiceApi.ChatMessageApprovalServiceService, bindChatMessageApprovalHandler(scope.resolve(ChatMessageApprovalHandler)));
  server.addService(messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceService, bindChatMessageCalculationHandler(scope.resolve(ChatMessageCalculationHandler)));
  server.addService(messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceService, bindChatMessageLifecycleHandler(scope.resolve(ChatMessageLifecycleHandler)));
  server.addService(messagingChatMessageQueryServiceApi.ChatMessageQueryServiceService, bindChatMessageQueryHandler(scope.resolve(ChatMessageQueryHandler)));
  server.addService(messagingChatMessageReportingServiceApi.ChatMessageReportingServiceService, bindChatMessageReportingHandler(scope.resolve(ChatMessageReportingHandler)));
  server.addService(messagingChatMessageSyncServiceApi.ChatMessageSyncServiceService, bindChatMessageSyncHandler(scope.resolve(ChatMessageSyncHandler)));
  server.addService(messagingChatMessageValidationServiceApi.ChatMessageValidationServiceService, bindChatMessageValidationHandler(scope.resolve(ChatMessageValidationHandler)));
  server.addService(messagingChatMessageWorkflowServiceApi.ChatMessageWorkflowServiceService, bindChatMessageWorkflowHandler(scope.resolve(ChatMessageWorkflowHandler)));
  server.addService(messagingConversationApprovalServiceApi.ConversationApprovalServiceService, bindConversationApprovalHandler(scope.resolve(ConversationApprovalHandler)));
  server.addService(messagingConversationCalculationServiceApi.ConversationCalculationServiceService, bindConversationCalculationHandler(scope.resolve(ConversationCalculationHandler)));
  server.addService(messagingConversationLifecycleServiceApi.ConversationLifecycleServiceService, bindConversationLifecycleHandler(scope.resolve(ConversationLifecycleHandler)));
  server.addService(messagingConversationQueryServiceApi.ConversationQueryServiceService, bindConversationQueryHandler(scope.resolve(ConversationQueryHandler)));
  server.addService(messagingConversationReportingServiceApi.ConversationReportingServiceService, bindConversationReportingHandler(scope.resolve(ConversationReportingHandler)));
  server.addService(messagingConversationServiceApi.ConversationServiceService, bindConversationHandler(scope.resolve(ConversationHandler)));
  server.addService(messagingConversationValidationServiceApi.ConversationValidationServiceService, bindConversationValidationHandler(scope.resolve(ConversationValidationHandler)));
  server.addService(messagingConversationWorkflowServiceApi.ConversationWorkflowServiceService, bindConversationWorkflowHandler(scope.resolve(ConversationWorkflowHandler)));
  server.addService(messagingParticipantApprovalServiceApi.ParticipantApprovalServiceService, bindParticipantApprovalHandler(scope.resolve(ParticipantApprovalHandler)));
  server.addService(messagingParticipantCalculationServiceApi.ParticipantCalculationServiceService, bindParticipantCalculationHandler(scope.resolve(ParticipantCalculationHandler)));
  server.addService(messagingParticipantImportServiceApi.ParticipantImportServiceService, bindParticipantImportHandler(scope.resolve(ParticipantImportHandler)));
  server.addService(messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceService, bindParticipantLifecycleHandler(scope.resolve(ParticipantLifecycleHandler)));
  server.addService(messagingParticipantReportingServiceApi.ParticipantReportingServiceService, bindParticipantReportingHandler(scope.resolve(ParticipantReportingHandler)));
  server.addService(messagingParticipantSyncServiceApi.ParticipantSyncServiceService, bindParticipantSyncHandler(scope.resolve(ParticipantSyncHandler)));
  server.addService(messagingParticipantValidationServiceApi.ParticipantValidationServiceService, bindParticipantValidationHandler(scope.resolve(ParticipantValidationHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<invoicingInvoiceBatchCalculationServiceApi.InvoiceBatchCalculationServiceClient>("acme.invoicing.v1.InvoiceBatchCalculationService");
  queue.consume<invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationRequest, invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationResponse>("acme.messaging.v1.ChannelApprovalService/ApproveChannel:0", async (request) =>
    call<invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationRequest, invoicingInvoiceBatchCalculationServiceApi.ExplainInvoiceBatchCalculationResponse>((input, done) => client0.explainInvoiceBatchCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient>("acme.messaging.v1.ChatMessageCalculationService");
  queue.consume<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>("acme.messaging.v1.ChannelCalculationService/CompareChannelOptions:0", async (request) =>
    call<messagingChatMessageCalculationServiceApi.RecalculateChatMessagesRequest, messagingChatMessageCalculationServiceApi.RecalculateChatMessagesResponse>((input, done) => client1.recalculateChatMessages(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<messagingChannelReportingServiceApi.ChannelReportingServiceClient>("acme.messaging.v1.ChannelReportingService");
  queue.consume<messagingChannelReportingServiceApi.DeleteChannelReportRequest, messagingChannelReportingServiceApi.DeleteChannelReportResponse>("acme.messaging.v1.ChannelLifecycleService/ActivateChannel:2", async (request) =>
    call<messagingChannelReportingServiceApi.DeleteChannelReportRequest, messagingChannelReportingServiceApi.DeleteChannelReportResponse>((input, done) => client2.deleteChannelReport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient>("acme.webhooks.v1.WebhookDeliveryWorkflowService");
  queue.consume<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>("acme.messaging.v1.ChannelReportingService/FetchChannelReport:0", async (request) =>
    call<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>((input, done) => client3.resumeWebhookDeliveryWorkflow(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<notificationsNotificationExportServiceApi.NotificationExportServiceClient>("acme.notifications.v1.NotificationExportService");
  queue.consume<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse>("acme.messaging.v1.ChannelSyncService/StreamChannelChanges:0", async (request) =>
    call<notificationsNotificationExportServiceApi.ShareNotificationExportRequest, notificationsNotificationExportServiceApi.ShareNotificationExportResponse>((input, done) => client4.shareNotificationExport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<messagingParticipantCalculationServiceApi.ParticipantCalculationServiceClient>("acme.messaging.v1.ParticipantCalculationService");
  queue.consume<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>("acme.messaging.v1.ChannelValidationService/ValidateChannel:1", async (request) =>
    call<messagingParticipantCalculationServiceApi.CompareParticipantOptionsRequest, messagingParticipantCalculationServiceApi.CompareParticipantOptionsResponse>((input, done) => client5.compareParticipantOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<messagingChannelSyncServiceApi.ChannelSyncServiceClient>("acme.messaging.v1.ChannelSyncService");
  queue.consume<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>("acme.messaging.v1.ChatMessageApprovalService/CommentChatMessageApproval:1", async (request) =>
    call<messagingChannelSyncServiceApi.GetChannelSyncStateRequest, messagingChannelSyncServiceApi.GetChannelSyncStateResponse>((input, done) => client6.getChannelSyncState(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<messagingConversationCalculationServiceApi.ConversationCalculationServiceClient>("acme.messaging.v1.ConversationCalculationService");
  queue.consume<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse>("acme.messaging.v1.ChatMessageCalculationService/SimulateChatMessage:1", async (request) =>
    call<messagingConversationCalculationServiceApi.RecalculateConversationsRequest, messagingConversationCalculationServiceApi.RecalculateConversationsResponse>((input, done) => client7.recalculateConversations(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient>("acme.messaging.v1.ChatMessageValidationService");
  queue.consume<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>("acme.messaging.v1.ChatMessageQueryService/SuggestChatMessages:0", async (request) =>
    call<messagingChatMessageValidationServiceApi.ValidateChatMessageRequest, messagingChatMessageValidationServiceApi.ValidateChatMessageResponse>((input, done) => client8.validateChatMessage(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<messagingParticipantValidationServiceApi.ParticipantValidationServiceClient>("acme.messaging.v1.ParticipantValidationService");
  queue.consume<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse>("acme.messaging.v1.ChatMessageSyncService/ReconcileChatMessages:0", async (request) =>
    call<messagingParticipantValidationServiceApi.CheckParticipantEligibilityRequest, messagingParticipantValidationServiceApi.CheckParticipantEligibilityResponse>((input, done) => client9.checkParticipantEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<messagingParticipantSyncServiceApi.ParticipantSyncServiceClient>("acme.messaging.v1.ParticipantSyncService");
  queue.consume<messagingParticipantSyncServiceApi.ReconcileParticipantsRequest, messagingParticipantSyncServiceApi.ReconcileParticipantsResponse>("acme.messaging.v1.ChatMessageWorkflowService/CancelChatMessageWorkflow:1", async (request) =>
    call<messagingParticipantSyncServiceApi.ReconcileParticipantsRequest, messagingParticipantSyncServiceApi.ReconcileParticipantsResponse>((input, done) => client10.reconcileParticipants(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<messagingChannelSyncServiceApi.ChannelSyncServiceClient>("acme.messaging.v1.ChannelSyncService");
  queue.consume<messagingChannelSyncServiceApi.ReconcileChannelsRequest, messagingChannelSyncServiceApi.ReconcileChannelsResponse>("acme.messaging.v1.ConversationApprovalService/RecallConversation:1", async (request) =>
    call<messagingChannelSyncServiceApi.ReconcileChannelsRequest, messagingChannelSyncServiceApi.ReconcileChannelsResponse>((input, done) => client11.reconcileChannels(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<bankingBankAccountQueryServiceApi.BankAccountQueryServiceClient>("acme.banking.v1.BankAccountQueryService");
  queue.consume<bankingBankAccountQueryServiceApi.ResolveBankAccountsRequest, bankingBankAccountQueryServiceApi.ResolveBankAccountsResponse>("acme.messaging.v1.ConversationLifecycleService/ExpireConversation:2", async (request) =>
    call<bankingBankAccountQueryServiceApi.ResolveBankAccountsRequest, bankingBankAccountQueryServiceApi.ResolveBankAccountsResponse>((input, done) => client12.resolveBankAccounts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient>("acme.localization.v1.TranslationKeyQueryService");
  queue.consume<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse>("acme.messaging.v1.ConversationQueryService/LookupConversation:0", async (request) =>
    call<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse>((input, done) => client13.resolveTranslationKeys(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient>("acme.notifications.v1.NotificationTemplateQueryService");
  queue.consume<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>("acme.messaging.v1.ConversationReportingService/ShareConversationReport:1", async (request) =>
    call<notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesRequest, notificationsNotificationTemplateQueryServiceApi.SuggestNotificationTemplatesResponse>((input, done) => client14.suggestNotificationTemplates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client15 = clients.get<messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient>("acme.messaging.v1.ChatMessageCalculationService");
  queue.consume<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>("acme.messaging.v1.ConversationValidationService/CheckConversationEligibility:1", async (request) =>
    call<messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationRequest, messagingChatMessageCalculationServiceApi.ExplainChatMessageCalculationResponse>((input, done) => client15.explainChatMessageCalculation(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client16 = clients.get<messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient>("acme.messaging.v1.ChatMessageSyncService");
  queue.consume<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>("acme.messaging.v1.ConversationWorkflowService/CancelConversationWorkflow:1", async (request) =>
    call<messagingChatMessageSyncServiceApi.PushChatMessageRequest, messagingChatMessageSyncServiceApi.PushChatMessageResponse>((input, done) => client16.pushChatMessage(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client17 = clients.get<inventoryStockItemQueryServiceApi.StockItemQueryServiceClient>("acme.inventory.v1.StockItemQueryService");
  queue.consume<inventoryStockItemQueryServiceApi.ResolveStockItemsRequest, inventoryStockItemQueryServiceApi.ResolveStockItemsResponse>("acme.messaging.v1.ParticipantApprovalService/EscalateParticipant:1", async (request) =>
    call<inventoryStockItemQueryServiceApi.ResolveStockItemsRequest, inventoryStockItemQueryServiceApi.ResolveStockItemsResponse>((input, done) => client17.resolveStockItems(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client18 = clients.get<ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient>("acme.ledger.v1.LedgerAccountQueryService");
  queue.consume<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse>("acme.messaging.v1.ParticipantCalculationService/ExplainParticipantCalculation:0", async (request) =>
    call<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse>((input, done) => client18.summarizeLedgerAccounts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client19 = clients.get<notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient>("acme.notifications.v1.NotificationTemplateHistoryService");
  queue.consume<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse>("acme.messaging.v1.ParticipantImportService/MapParticipantImportColumns:1", async (request) =>
    call<notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.ListNotificationTemplateVersionsResponse>((input, done) => client19.listNotificationTemplateVersions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client20 = clients.get<auditAuditEventValidationServiceApi.AuditEventValidationServiceClient>("acme.audit.v1.AuditEventValidationService");
  queue.consume<auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest, auditAuditEventValidationServiceApi.CheckAuditEventEligibilityResponse>("acme.messaging.v1.ParticipantLifecycleService/ScheduleParticipantExpiry:1", async (request) =>
    call<auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest, auditAuditEventValidationServiceApi.CheckAuditEventEligibilityResponse>((input, done) => client20.checkAuditEventEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client21 = clients.get<messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient>("acme.messaging.v1.ChatMessageValidationService");
  queue.consume<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse>("acme.messaging.v1.ParticipantReportingService/ScheduleParticipantReport:3", async (request) =>
    call<messagingChatMessageValidationServiceApi.LintChatMessagesRequest, messagingChatMessageValidationServiceApi.LintChatMessagesResponse>((input, done) => client21.lintChatMessages(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client22 = clients.get<messagingChatMessageSyncServiceApi.ChatMessageSyncServiceClient>("acme.messaging.v1.ChatMessageSyncService");
  queue.consume<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>("acme.messaging.v1.ParticipantSyncService/SyncParticipants:2", async (request) =>
    call<messagingChatMessageSyncServiceApi.ResolveChatMessageConflictRequest, messagingChatMessageSyncServiceApi.ResolveChatMessageConflictResponse>((input, done) => client22.resolveChatMessageConflict(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
