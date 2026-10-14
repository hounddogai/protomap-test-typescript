import * as campaignsMarketingCampaignQueryServiceApi from "../../../.cache/proto/acme/campaigns/v1/marketing_campaign_query_service.js";
import * as catalogProductQueryServiceApi from "../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as chatChatRoomApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncMarketingCampaignsId keeps of each SuggestMarketingCampaigns response. */
interface SyncMarketingCampaignsIdRecord {
  correlationId: string;
  status: string;
  nextPageToken: string;
}

/** Where syncMarketingCampaignsId hands each record. */
interface SyncMarketingCampaignsIdWriter {
  write(record: SyncMarketingCampaignsIdRecord): Promise<void>;
}

/** Passes records to acme.chat.v1.ChatRoomApprovalService. */
class SyncMarketingCampaignsIdChatRoomApproval implements SyncMarketingCampaignsIdWriter {
  private readonly client: chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomApprovalServiceApi.ChatRoomApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncMarketingCampaignsIdRecord): Promise<void> {
    await call<chatChatRoomApprovalServiceApi.ListPendingChatRoomsRequest, chatChatRoomApprovalServiceApi.ListPendingChatRoomsResponse>(
      (request, done) => this.client.listPendingChatRooms(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatRoomApprovalServiceApi.ListPendingChatRoomsRequest.fromPartial({ page: { pageToken: record.correlationId }, filter: { region: record.status } }));
  }
}

/** Hands records to acme.catalog.v1.ProductQueryService. */
class SyncMarketingCampaignsIdProductQuery implements SyncMarketingCampaignsIdWriter {
  private readonly client: catalogProductQueryServiceApi.ProductQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new catalogProductQueryServiceApi.ProductQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncMarketingCampaignsIdRecord): Promise<void> {
    await retry(() => call<catalogProductQueryServiceApi.LookupProductRequest, catalogProductQueryServiceApi.LookupProductResponse>(
      (request, done) => this.client.lookupProduct(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      catalogProductQueryServiceApi.LookupProductRequest.fromPartial({ productId: record.correlationId })));
  }
}

/**
 * Reads acme.campaigns.v1.MarketingCampaignQueryService/SuggestMarketingCampaigns and hands what it keeps to
 * the sink of its kind.
 */
export async function syncMarketingCampaignsId(runtime: Runtime): Promise<void> {
  const source = new campaignsMarketingCampaignQueryServiceApi.MarketingCampaignQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest, campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsResponse>(
    (request, done) => source.suggestMarketingCampaigns(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    campaignsMarketingCampaignQueryServiceApi.SuggestMarketingCampaignsRequest.fromPartial({ orderBy: "primary-sync-marketing-campaigns-id" }));
  const row: SyncMarketingCampaignsIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    nextPageToken: text.normalize(reply.pageInfo?.nextPageToken ?? ""),
  };
  const sinks: SyncMarketingCampaignsIdWriter[] = [
    new SyncMarketingCampaignsIdChatRoomApproval(runtime),
    new SyncMarketingCampaignsIdProductQuery(runtime),
  ];
  for (const sink of sinks) {
    await sink.write(row);
  }
}
