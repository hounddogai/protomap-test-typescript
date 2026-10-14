import * as audiencesAudienceSyncWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_workflow_service.js";
import * as inventoryStockItemServiceApi from "../../../.cache/proto/acme/inventory/v1/stock_item_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayStockItemId keeps of each CloneStockItem response. */
interface RelayStockItemIdRecord {
  stockItemId: string;
  name: string;
  message: string;
}

/**
 * Reads acme.inventory.v1.StockItemService/CloneStockItem, keeps its fields by name, and passes some of them
 * to acme.audiences.v1.AudienceSyncWorkflowService.
 */
export async function relayStockItemId(runtime: Runtime): Promise<void> {
  const origin = new inventoryStockItemServiceApi.StockItemServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<inventoryStockItemServiceApi.CloneStockItemRequest, inventoryStockItemServiceApi.CloneStockItemResponse>(
    (request, done) => origin.cloneStockItem(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    inventoryStockItemServiceApi.CloneStockItemRequest.fromPartial({ requestId: "primary-relay-stock-item-id" }));
  const entry: RelayStockItemIdRecord = {
    stockItemId: reply.stockItem?.stockItemId ?? "",
    name: text.normalize(reply.stockItem?.name ?? ""),
    message: reply.result?.message ?? "",
  };
  const params = new Headers();
  params.set("x-stock-item-id", entry.stockItemId);
  params.set("x-name", entry.name);
  params.set("x-message", entry.message);
  const target = new audiencesAudienceSyncWorkflowServiceApi.AudienceSyncWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  await call<audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest, audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsResponse>(
    (request, done) => target.listAudienceSyncWorkflows(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    audiencesAudienceSyncWorkflowServiceApi.ListAudienceSyncWorkflowsRequest.fromPartial({ filter: { region: params.get("x-name") ?? "" } }));
}
