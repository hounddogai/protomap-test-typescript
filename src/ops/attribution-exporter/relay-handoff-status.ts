import * as chatHandoffApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_approval_service.js";
import * as formsFormApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as notificationsNotificationHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_history_service.js";
import * as webbffPageCompositionServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayHandoffStatus keeps of each RecallHandoff response. */
interface RelayHandoffStatusRecord {
  status: string;
  resultStatus: string;
  handoffId: string;
}

/** Where relayHandoffStatus hands each record. */
interface RelayHandoffStatusDestination {
  forward(record: RelayHandoffStatusRecord): Promise<void>;
}

/** Writes records to acme.notifications.v1.NotificationHistoryService. */
class RelayHandoffStatusNotificationHistory implements RelayHandoffStatusDestination {
  private readonly client: notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationHistoryServiceApi.NotificationHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayHandoffStatusRecord): Promise<void> {
    await call<notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest, notificationsNotificationHistoryServiceApi.CompareNotificationVersionsResponse>(
      (request, done) => this.client.compareNotificationVersions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationHistoryServiceApi.CompareNotificationVersionsRequest.fromPartial({ details: { authorEmail: record.resultStatus } }));
  }
}

/** Writes records to acme.forms.v1.FormApprovalService. */
class RelayHandoffStatusFormApproval implements RelayHandoffStatusDestination {
  private readonly client: formsFormApprovalServiceApi.FormApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormApprovalServiceApi.FormApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayHandoffStatusRecord): Promise<void> {
    await retry(() => call<formsFormApprovalServiceApi.EscalateFormRequest, formsFormApprovalServiceApi.EscalateFormResponse>(
      (request, done) => this.client.escalateForm(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      formsFormApprovalServiceApi.EscalateFormRequest.fromPartial({ reason: record.handoffId, formId: record.status })));
  }
}

/** Hands records to acme.webbff.v1.PageCompositionService. */
class RelayHandoffStatusPageComposition implements RelayHandoffStatusDestination {
  private readonly client: webbffPageCompositionServiceApi.PageCompositionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionServiceApi.PageCompositionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: RelayHandoffStatusRecord): Promise<void> {
    await call<webbffPageCompositionServiceApi.DeletePageCompositionRequest, webbffPageCompositionServiceApi.DeletePageCompositionResponse>(
      (request, done) => this.client.deletePageComposition(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webbffPageCompositionServiceApi.DeletePageCompositionRequest.fromPartial({ reason: record.handoffId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayHandoffStatusLogOnly implements RelayHandoffStatusDestination {
  async forward(record: RelayHandoffStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRelayHandoffStatus(kind: string, record: RelayHandoffStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: RelayHandoffStatusRecord): Promise<void> => new RelayHandoffStatusLogOnly().forward(item);
  switch (kind) {
    case "notification-history":
      write = (item) => new RelayHandoffStatusNotificationHistory(runtime).forward(item);
      break;
    case "form-approval":
      write = (item) => new RelayHandoffStatusFormApproval(runtime).forward(item);
      break;
    case "page-composition":
      write = (item) => new RelayHandoffStatusPageComposition(runtime).forward(item);
      break;
  }
  await write(record);
}

/** Reads acme.chat.v1.HandoffApprovalService/RecallHandoff and hands what it keeps to the sink of its kind. */
export async function relayHandoffStatus(runtime: Runtime): Promise<void> {
  const origin = new chatHandoffApprovalServiceApi.HandoffApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<chatHandoffApprovalServiceApi.RecallHandoffRequest, chatHandoffApprovalServiceApi.RecallHandoffResponse>(
    (request, done) => origin.recallHandoff(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    chatHandoffApprovalServiceApi.RecallHandoffRequest.fromPartial({ handoffId: "nightly-relay-handoff-status" }));
  const row: RelayHandoffStatusRecord = {
    status: found.outcome?.status ?? "",
    resultStatus: found.result?.status ?? "",
    handoffId: found.handoff?.handoffId ?? "",
  };
  await dispatchRelayHandoffStatus("page-composition", row, runtime);
}
