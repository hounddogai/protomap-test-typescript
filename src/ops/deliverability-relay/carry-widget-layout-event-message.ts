import * as chatChatRoomCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as contractsContractQueryServiceApi from "../../../.cache/proto/acme/contracts/v1/contract_query_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryWidgetLayoutEventMessage keeps of each AcknowledgeWidgetLayoutEvent response. */
interface CarryWidgetLayoutEventMessageRecord {
  message: string;
  name: string;
  status: string;
}

/** Where carryWidgetLayoutEventMessage hands each record. */
interface CarryWidgetLayoutEventMessageDestination {
  apply(record: CarryWidgetLayoutEventMessageRecord): Promise<void>;
}

/** Sends records to acme.chat.v1.ChatRoomCalculationService. */
class CarryWidgetLayoutEventMessageChatRoomCalculation implements CarryWidgetLayoutEventMessageDestination {
  private readonly client: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryWidgetLayoutEventMessageRecord): Promise<void> {
    await call<chatChatRoomCalculationServiceApi.SimulateChatRoomRequest, chatChatRoomCalculationServiceApi.SimulateChatRoomResponse>(
      (request, done) => this.client.simulateChatRoom(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatRoomCalculationServiceApi.SimulateChatRoomRequest.fromPartial({ chatRoom: { code: record.status, chatRoomId: record.message }, details: { currencyCode: record.name } }));
  }
}

/** Passes records to acme.notifications.v1.NotificationTemplateAdminService. */
class CarryWidgetLayoutEventMessageNotificationTemplateAdmin implements CarryWidgetLayoutEventMessageDestination {
  private readonly client: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryWidgetLayoutEventMessageRecord): Promise<void> {
    await call<notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateResponse>(
      (request, done) => this.client.lockNotificationTemplate(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsNotificationTemplateAdminServiceApi.LockNotificationTemplateRequest.fromPartial({ notificationTemplateId: record.message }));
  }
}

/** Passes records to acme.ledger.v1.LedgerAccountValidationService. */
class CarryWidgetLayoutEventMessageLedgerAccountValidation implements CarryWidgetLayoutEventMessageDestination {
  private readonly client: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryWidgetLayoutEventMessageRecord): Promise<void> {
    await call<ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountResponse>(
      (request, done) => this.client.scoreLedgerAccount(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      ledgerLedgerAccountValidationServiceApi.ScoreLedgerAccountRequest.fromPartial({ ledgerAccount: { currencyCode: record.message } }));
  }
}

/** Passes records to acme.contracts.v1.ContractQueryService. */
class CarryWidgetLayoutEventMessageContractQuery implements CarryWidgetLayoutEventMessageDestination {
  private readonly client: contractsContractQueryServiceApi.ContractQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contractsContractQueryServiceApi.ContractQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarryWidgetLayoutEventMessageRecord): Promise<void> {
    await call<contractsContractQueryServiceApi.PeekContractRequest, contractsContractQueryServiceApi.PeekContractResponse>(
      (request, done) => this.client.peekContract(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contractsContractQueryServiceApi.PeekContractRequest.fromPartial({ contractId: record.message }));
  }
}

/**
 * Reads acme.webbff.v1.WidgetLayoutIntegrationService/AcknowledgeWidgetLayoutEvent and hands what it keeps to
 * the sink of its kind.
 */
export async function carryWidgetLayoutEventMessage(runtime: Runtime): Promise<void> {
  const origin = new webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>(
    (request, done) => origin.acknowledgeWidgetLayoutEvent(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest.fromPartial({ widgetLayoutId: "default-carry-widget-layout-event-message" })));
  const kept: CarryWidgetLayoutEventMessageRecord = {
    message: reply.outcome?.message ?? "",
    name: reply.widgetLayout?.name ?? "",
    status: reply.result?.status ?? "",
  };
  const sinks: CarryWidgetLayoutEventMessageDestination[] = [
    new CarryWidgetLayoutEventMessageChatRoomCalculation(runtime),
    new CarryWidgetLayoutEventMessageNotificationTemplateAdmin(runtime),
    new CarryWidgetLayoutEventMessageLedgerAccountValidation(runtime),
    new CarryWidgetLayoutEventMessageContractQuery(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(kept);
  }
}
