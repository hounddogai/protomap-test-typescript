import * as campaignsMarketingCampaignApprovalServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_approval_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import * as notificationsDeliveryAttemptAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_admin_service.js";
import * as searchSearchIndexServiceApi from "../../../.cache/proto/acme/search/v1/search_index_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleChatRoomApprovalId keeps of each DelegateChatRoomApproval response. */
interface SettleChatRoomApprovalIdRecord {
  correlationId: string;
  code: string;
  message: string;
}

/** Where settleChatRoomApprovalId hands each record. */
interface SettleChatRoomApprovalIdDestination {
  push(record: SettleChatRoomApprovalIdRecord): Promise<void>;
}

/** Passes records to acme.search.v1.SearchIndexService. */
class SettleChatRoomApprovalIdSearchIndex implements SettleChatRoomApprovalIdDestination {
  private readonly client: searchSearchIndexServiceApi.SearchIndexServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexServiceApi.SearchIndexServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatRoomApprovalIdRecord): Promise<void> {
    await call<searchSearchIndexServiceApi.CreateSearchIndexRequest, searchSearchIndexServiceApi.CreateSearchIndexResponse>(
      (request, done) => this.client.createSearchIndex(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      searchSearchIndexServiceApi.CreateSearchIndexRequest.fromPartial({ searchIndex: { searchIndexId: record.message, name: record.correlationId }, requestId: record.code }));
  }
}

/** Passes records to acme.campaigns.v1.MarketingCampaignApprovalService. */
class SettleChatRoomApprovalIdMarketingCampaignApproval implements SettleChatRoomApprovalIdDestination {
  private readonly client: campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new campaignsMarketingCampaignApprovalServiceApi.MarketingCampaignApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatRoomApprovalIdRecord): Promise<void> {
    await retry(() => call<campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusRequest, campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusResponse>(
      (request, done) => this.client.getMarketingCampaignApprovalStatus(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      campaignsMarketingCampaignApprovalServiceApi.GetMarketingCampaignApprovalStatusRequest.fromPartial({ marketingCampaignId: record.code })));
  }
}

/** Sends records to acme.notifications.v1.DeliveryAttemptAdminService. */
class SettleChatRoomApprovalIdDeliveryAttemptAdmin implements SettleChatRoomApprovalIdDestination {
  private readonly client: notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptAdminServiceApi.DeliveryAttemptAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SettleChatRoomApprovalIdRecord): Promise<void> {
    await retry(() => call<notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptRequest, notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptResponse>(
      (request, done) => this.client.reassignDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      notificationsDeliveryAttemptAdminServiceApi.ReassignDeliveryAttemptRequest.fromPartial({ reason: record.correlationId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class SettleChatRoomApprovalIdLogOnly implements SettleChatRoomApprovalIdDestination {
  async push(record: SettleChatRoomApprovalIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchSettleChatRoomApprovalId(kind: string, record: SettleChatRoomApprovalIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: SettleChatRoomApprovalIdRecord): Promise<void> => new SettleChatRoomApprovalIdLogOnly().push(item);
  switch (kind) {
    case "search-index":
      write = (item) => new SettleChatRoomApprovalIdSearchIndex(runtime).push(item);
      break;
    case "marketing-campaign-approval":
      write = (item) => new SettleChatRoomApprovalIdMarketingCampaignApproval(runtime).push(item);
      break;
    case "delivery-attempt-admin":
      write = (item) => new SettleChatRoomApprovalIdDeliveryAttemptAdmin(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.chat.v1.ChatRoomApprovalService/DelegateChatRoomApproval and hands what it keeps to the sink of
 * its kind.
 */
export async function settleChatRoomApprovalId(runtime: Runtime): Promise<void> {
  const source = new chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalRequest, chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalResponse>(
    (request, done) => source.delegateChatRoomApproval(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatChatRoomApprovalServiceApi.DelegateChatRoomApprovalRequest.fromPartial({ chatRoomId: "nightly-settle-chat-room-approval-id" }));
  const kept: SettleChatRoomApprovalIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    code: text.normalize(reply.chatRoom?.code ?? ""),
    message: text.normalize(reply.result?.message ?? ""),
  };
  await dispatchSettleChatRoomApprovalId("search-index", kept, runtime);
}
