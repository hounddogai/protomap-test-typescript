/**
 * Register the chat team's public gRPC boundary and workers.
 */

import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as chatChatBotCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_calculation_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as chatChatBotQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_query_service.js";
import * as chatChatBotReportingServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_reporting_service.js";
import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatBotWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_workflow_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as chatChatRoomLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_lifecycle_service.js";
import * as chatChatRoomQueryServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_query_service.js";
import * as chatChatRoomServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as chatChatRoomValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_validation_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as chatHandoffApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as chatHandoffCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as chatHandoffLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_lifecycle_service.js";
import * as chatHandoffReportingServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as chatHandoffSyncServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as chatHandoffValidationServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_validation_service.js";
import * as chatHandoffWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_workflow_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureImportServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as showsShowQueryServiceApi from "../../../.cache/proto/acme/shows/v1/show_query_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  ChatBotCalculationHandler,
  implementation as bindChatBotCalculationHandler,
} from "./features/chat-bot/chat-bot-calculation.handler.js";
import {
  ChatBotReportingHandler,
  implementation as bindChatBotReportingHandler,
} from "./features/chat-bot/chat-bot-reporting.handler.js";
import {
  ChatRoomApprovalHandler,
  implementation as bindChatRoomApprovalHandler,
} from "./features/chat-room/chat-room-approval.handler.js";
import {
  ChatRoomQueryHandler,
  implementation as bindChatRoomQueryHandler,
} from "./features/chat-room/chat-room-query.handler.js";
import {
  ChatRoomWorkflowHandler,
  implementation as bindChatRoomWorkflowHandler,
} from "./features/chat-room/chat-room-workflow.handler.js";
import {
  HandoffLifecycleHandler,
  implementation as bindHandoffLifecycleHandler,
} from "./features/handoff/handoff-lifecycle.handler.js";
import {
  HandoffValidationHandler,
  implementation as bindHandoffValidationHandler,
} from "./features/handoff/handoff-validation.handler.js";
import { ChatBotApprovalHandler, implementation as bindChatBotApprovalHandler } from "./services/chat-bot-approval.js";
import { ChatBotQueryHandler, implementation as bindChatBotQueryHandler } from "./services/chat-bot-query.js";
import { ChatBotWorkflowHandler, implementation as bindChatBotWorkflowHandler } from "./services/chat-bot-workflow.js";
import {
  ChatRoomLifecycleHandler,
  implementation as bindChatRoomLifecycleHandler,
} from "./services/chat-room-lifecycle.js";
import {
  ChatRoomValidationHandler,
  implementation as bindChatRoomValidationHandler,
} from "./services/chat-room-validation.js";
import {
  HandoffCalculationHandler,
  implementation as bindHandoffCalculationHandler,
} from "./services/handoff-calculation.js";
import { HandoffSyncHandler, implementation as bindHandoffSyncHandler } from "./services/handoff-sync.js";
import {
  ChatBotLifecycleHandler,
  implementation as bindChatBotLifecycleHandler,
} from "./transport/chat-bot-lifecycle.js";
import {
  ChatBotValidationHandler,
  implementation as bindChatBotValidationHandler,
} from "./transport/chat-bot-validation.js";
import {
  ChatRoomCalculationHandler,
  implementation as bindChatRoomCalculationHandler,
} from "./transport/chat-room-calculation.js";
import { ChatRoomHandler, implementation as bindChatRoomHandler } from "./transport/chat-room.js";
import { HandoffApprovalHandler, implementation as bindHandoffApprovalHandler } from "./transport/handoff-approval.js";
import {
  HandoffReportingHandler,
  implementation as bindHandoffReportingHandler,
} from "./transport/handoff-reporting.js";
import { HandoffWorkflowHandler, implementation as bindHandoffWorkflowHandler } from "./transport/handoff-workflow.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(chatChatBotApprovalServiceApi.ChatBotApprovalServiceService, bindChatBotApprovalHandler(scope.resolve(ChatBotApprovalHandler)));
  server.addService(chatChatBotCalculationServiceApi.ChatBotCalculationServiceService, bindChatBotCalculationHandler(scope.resolve(ChatBotCalculationHandler)));
  server.addService(chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceService, bindChatBotLifecycleHandler(scope.resolve(ChatBotLifecycleHandler)));
  server.addService(chatChatBotQueryServiceApi.ChatBotQueryServiceService, bindChatBotQueryHandler(scope.resolve(ChatBotQueryHandler)));
  server.addService(chatChatBotReportingServiceApi.ChatBotReportingServiceService, bindChatBotReportingHandler(scope.resolve(ChatBotReportingHandler)));
  server.addService(chatChatBotValidationServiceApi.ChatBotValidationServiceService, bindChatBotValidationHandler(scope.resolve(ChatBotValidationHandler)));
  server.addService(chatChatBotWorkflowServiceApi.ChatBotWorkflowServiceService, bindChatBotWorkflowHandler(scope.resolve(ChatBotWorkflowHandler)));
  server.addService(chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceService, bindChatRoomApprovalHandler(scope.resolve(ChatRoomApprovalHandler)));
  server.addService(chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceService, bindChatRoomCalculationHandler(scope.resolve(ChatRoomCalculationHandler)));
  server.addService(chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceService, bindChatRoomLifecycleHandler(scope.resolve(ChatRoomLifecycleHandler)));
  server.addService(chatChatRoomQueryServiceApi.ChatRoomQueryServiceService, bindChatRoomQueryHandler(scope.resolve(ChatRoomQueryHandler)));
  server.addService(chatChatRoomServiceApi.ChatRoomServiceService, bindChatRoomHandler(scope.resolve(ChatRoomHandler)));
  server.addService(chatChatRoomValidationServiceApi.ChatRoomValidationServiceService, bindChatRoomValidationHandler(scope.resolve(ChatRoomValidationHandler)));
  server.addService(chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceService, bindChatRoomWorkflowHandler(scope.resolve(ChatRoomWorkflowHandler)));
  server.addService(chatHandoffApprovalServiceApi.HandoffApprovalServiceService, bindHandoffApprovalHandler(scope.resolve(HandoffApprovalHandler)));
  server.addService(chatHandoffCalculationServiceApi.HandoffCalculationServiceService, bindHandoffCalculationHandler(scope.resolve(HandoffCalculationHandler)));
  server.addService(chatHandoffLifecycleServiceApi.HandoffLifecycleServiceService, bindHandoffLifecycleHandler(scope.resolve(HandoffLifecycleHandler)));
  server.addService(chatHandoffReportingServiceApi.HandoffReportingServiceService, bindHandoffReportingHandler(scope.resolve(HandoffReportingHandler)));
  server.addService(chatHandoffSyncServiceApi.HandoffSyncServiceService, bindHandoffSyncHandler(scope.resolve(HandoffSyncHandler)));
  server.addService(chatHandoffValidationServiceApi.HandoffValidationServiceService, bindHandoffValidationHandler(scope.resolve(HandoffValidationHandler)));
  server.addService(chatHandoffWorkflowServiceApi.HandoffWorkflowServiceService, bindHandoffWorkflowHandler(scope.resolve(HandoffWorkflowHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<chatChatBotReportingServiceApi.ChatBotReportingServiceClient>("acme.chat.v1.ChatBotReportingService");
  queue.consume<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse>("acme.chat.v1.ChatBotApprovalService/RecallChatBot:2", async (request) =>
    call<chatChatBotReportingServiceApi.ListChatBotReportsRequest, chatChatBotReportingServiceApi.ListChatBotReportsResponse>((input, done) => client0.listChatBotReports(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient>("acme.experiments.v1.ExperimentValidationService");
  queue.consume<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>("acme.chat.v1.ChatBotCalculationService/EstimateChatBot:2", async (request) =>
    call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>((input, done) => client1.checkExperimentEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient>("acme.chat.v1.ChatRoomValidationService");
  queue.consume<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>("acme.chat.v1.ChatBotLifecycleService/ScheduleChatBotExpiry:2", async (request) =>
    call<chatChatRoomValidationServiceApi.PreviewChatRoomRequest, chatChatRoomValidationServiceApi.PreviewChatRoomResponse>((input, done) => client2.previewChatRoom(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient>("acme.chat.v1.ChatRoomValidationService");
  queue.consume<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>("acme.chat.v1.ChatBotReportingService/DeleteChatBotReport:3", async (request) =>
    call<chatChatRoomValidationServiceApi.CheckChatRoomEligibilityRequest, chatChatRoomValidationServiceApi.CheckChatRoomEligibilityResponse>((input, done) => client3.checkChatRoomEligibility(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<chatChatRoomValidationServiceApi.ChatRoomValidationServiceClient>("acme.chat.v1.ChatRoomValidationService");
  queue.consume<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>("acme.chat.v1.ChatBotValidationService/LintChatBots:0", async (request) =>
    call<chatChatRoomValidationServiceApi.LintChatRoomsRequest, chatChatRoomValidationServiceApi.LintChatRoomsResponse>((input, done) => client4.lintChatRooms(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<chatHandoffApprovalServiceApi.HandoffApprovalServiceClient>("acme.chat.v1.HandoffApprovalService");
  queue.consume<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>("acme.chat.v1.ChatBotWorkflowService/PauseChatBotWorkflow:1", async (request) =>
    call<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>((input, done) => client5.listPendingHandoffs(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<chatChatRoomLifecycleServiceApi.ChatRoomLifecycleServiceClient>("acme.chat.v1.ChatRoomLifecycleService");
  queue.consume<chatChatRoomLifecycleServiceApi.RenewChatRoomRequest, chatChatRoomLifecycleServiceApi.RenewChatRoomResponse>("acme.chat.v1.ChatRoomApprovalService/RejectChatRoom:0", async (request) =>
    call<chatChatRoomLifecycleServiceApi.RenewChatRoomRequest, chatChatRoomLifecycleServiceApi.RenewChatRoomResponse>((input, done) => client6.renewChatRoom(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient>("acme.maintenance.v1.WorkOrderCalculationService");
  queue.consume<maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsRequest, maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsResponse>("acme.chat.v1.ChatRoomCalculationService/RecalculateChatRooms:1", async (request) =>
    call<maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsRequest, maintenanceWorkOrderCalculationServiceApi.CompareWorkOrderOptionsResponse>((input, done) => client7.compareWorkOrderOptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<chatHandoffValidationServiceApi.HandoffValidationServiceClient>("acme.chat.v1.HandoffValidationService");
  queue.consume<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse>("acme.chat.v1.ChatRoomQueryService/CountChatRooms:0", async (request) =>
    call<chatHandoffValidationServiceApi.PreviewHandoffRequest, chatHandoffValidationServiceApi.PreviewHandoffResponse>((input, done) => client8.previewHandoff(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<chatHandoffValidationServiceApi.HandoffValidationServiceClient>("acme.chat.v1.HandoffValidationService");
  queue.consume<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse>("acme.chat.v1.ChatRoomService/CreateChatRoom:1", async (request) =>
    call<chatHandoffValidationServiceApi.NormalizeHandoffRequest, chatHandoffValidationServiceApi.NormalizeHandoffResponse>((input, done) => client9.normalizeHandoff(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client10 = clients.get<chatChatBotCalculationServiceApi.ChatBotCalculationServiceClient>("acme.chat.v1.ChatBotCalculationService");
  queue.consume<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse>("acme.chat.v1.ChatRoomValidationService/NormalizeChatRoom:0", async (request) =>
    call<chatChatBotCalculationServiceApi.CalculateChatBotRequest, chatChatBotCalculationServiceApi.CalculateChatBotResponse>((input, done) => client10.calculateChatBot(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client11 = clients.get<showsShowQueryServiceApi.ShowQueryServiceClient>("acme.shows.v1.ShowQueryService");
  queue.consume<showsShowQueryServiceApi.FindShowsRequest, showsShowQueryServiceApi.FindShowsResponse>("acme.chat.v1.ChatRoomWorkflowService/PauseChatRoomWorkflow:1", async (request) =>
    call<showsShowQueryServiceApi.FindShowsRequest, showsShowQueryServiceApi.FindShowsResponse>((input, done) => client11.findShows(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client12 = clients.get<chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient>("acme.chat.v1.ChatBotApprovalService");
  queue.consume<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse>("acme.chat.v1.HandoffApprovalService/RejectHandoff:1", async (request) =>
    call<chatChatBotApprovalServiceApi.RecallChatBotRequest, chatChatBotApprovalServiceApi.RecallChatBotResponse>((input, done) => client12.recallChatBot(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client13 = clients.get<localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient>("acme.localization.v1.TranslationKeyApprovalService");
  queue.consume<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse>("acme.chat.v1.HandoffLifecycleService/ExpireHandoff:2", async (request) =>
    call<localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalRequest, localizationTranslationKeyApprovalServiceApi.DelegateTranslationKeyApprovalResponse>((input, done) => client13.delegateTranslationKeyApproval(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client14 = clients.get<experimentsExposureImportServiceApi.ExposureImportServiceClient>("acme.experiments.v1.ExposureImportService");
  queue.consume<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>("acme.chat.v1.HandoffReportingService/ScheduleHandoffReport:1", async (request) =>
    call<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>((input, done) => client14.retryExposureImport(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client15 = clients.get<chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient>("acme.chat.v1.ChatRoomCalculationService");
  queue.consume<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>("acme.chat.v1.HandoffValidationService/ExplainHandoffDecision:0", async (request) =>
    call<chatChatRoomCalculationServiceApi.QuoteChatRoomRequest, chatChatRoomCalculationServiceApi.QuoteChatRoomResponse>((input, done) => client15.quoteChatRoom(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client16 = clients.get<chatHandoffApprovalServiceApi.HandoffApprovalServiceClient>("acme.chat.v1.HandoffApprovalService");
  queue.consume<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>("acme.chat.v1.HandoffWorkflowService/AdvanceHandoffWorkflow:2", async (request) =>
    call<chatHandoffApprovalServiceApi.ListPendingHandoffsRequest, chatHandoffApprovalServiceApi.ListPendingHandoffsResponse>((input, done) => client16.listPendingHandoffs(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client17 = clients.get<chatHandoffLifecycleServiceApi.HandoffLifecycleServiceClient>("acme.chat.v1.HandoffLifecycleService");
  queue.consume<chatHandoffLifecycleServiceApi.ExpireHandoffRequest, chatHandoffLifecycleServiceApi.ExpireHandoffResponse>("acme.chat.v1.HandoffWorkflowService/StartHandoffWorkflow:1", async (request) =>
    call<chatHandoffLifecycleServiceApi.ExpireHandoffRequest, chatHandoffLifecycleServiceApi.ExpireHandoffResponse>((input, done) => client17.expireHandoff(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
