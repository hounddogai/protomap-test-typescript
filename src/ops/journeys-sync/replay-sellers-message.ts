import * as chatHandoffSyncServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as sellersSellerQueryServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replaySellersMessage keeps of each BrowseSellers response. */
interface ReplaySellersMessageRecord {
  message: string;
  nextPageToken: string;
  status: string;
}

/**
 * Reads acme.sellers.v1.SellerQueryService/BrowseSellers, keeps its fields by name, and passes some of them
 * to acme.chat.v1.HandoffSyncService.
 */
export async function replaySellersMessage(runtime: Runtime): Promise<void> {
  const source = new sellersSellerQueryServiceApi.SellerQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<sellersSellerQueryServiceApi.BrowseSellersRequest, sellersSellerQueryServiceApi.BrowseSellersResponse>(
    (request, done) => source.browseSellers(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    sellersSellerQueryServiceApi.BrowseSellersRequest.fromPartial({ orderBy: "main-replay-sellers-message" }));
  const record: ReplaySellersMessageRecord = {
    message: found.result?.message ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
    status: found.result?.status ?? "",
  };
  const params = new Headers();
  params.set("x-message", record.message);
  params.set("x-next-page-token", record.nextPageToken);
  params.set("x-status", record.status);
  const writer = new chatHandoffSyncServiceApi.HandoffSyncServiceClient(runtime.mesh, credentials.createInsecure());
  await call<chatHandoffSyncServiceApi.ReconcileHandoffsRequest, chatHandoffSyncServiceApi.ReconcileHandoffsResponse>(
    (request, done) => writer.reconcileHandoffs(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatHandoffSyncServiceApi.ReconcileHandoffsRequest.fromPartial({ reason: params.get("x-status") ?? "" }));
}
