import * as inventoryStockItemQueryServiceApi from "../../../.cache/proto/acme/inventory/v1/stock_item_query_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as modelregistryRegisteredModelQueryServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_query_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateStockItemMessage keeps of each LookupStockItem response. */
interface PropagateStockItemMessageRecord {
  message: string;
  stockItemId: string;
}

/** Where propagateStockItemMessage hands each record. */
interface PropagateStockItemMessageDestination {
  deliver(record: PropagateStockItemMessageRecord): Promise<void>;
}

/** Hands records to acme.modelregistry.v1.RegisteredModelQueryService. */
class PropagateStockItemMessageRegisteredModelQuery implements PropagateStockItemMessageDestination {
  private readonly client: modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new modelregistryRegisteredModelQueryServiceApi.RegisteredModelQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateStockItemMessageRecord): Promise<void> {
    await call<modelregistryRegisteredModelQueryServiceApi.PeekRegisteredModelRequest, modelregistryRegisteredModelQueryServiceApi.PeekRegisteredModelResponse>(
      (request, done) => this.client.peekRegisteredModel(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      modelregistryRegisteredModelQueryServiceApi.PeekRegisteredModelRequest.fromPartial({ registeredModelId: record.stockItemId }));
  }
}

/** Passes records to acme.localization.v1.TranslationKeyWorkflowService. */
class PropagateStockItemMessageTranslationKeyWorkflow implements PropagateStockItemMessageDestination {
  private readonly client: localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateStockItemMessageRecord): Promise<void> {
    await retry(() => call<localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowResponse>(
      (request, done) => this.client.advanceTranslationKeyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      localizationTranslationKeyWorkflowServiceApi.AdvanceTranslationKeyWorkflowRequest.fromPartial({ details: { step: record.stockItemId } })));
  }
}

/** Hands records to acme.notifications.v1.SubscriptionWorkflowService. */
class PropagateStockItemMessageSubscriptionWorkflow implements PropagateStockItemMessageDestination {
  private readonly client: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateStockItemMessageRecord): Promise<void> {
    await retry(() => call<notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest, notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowResponse>(
      (request, done) => this.client.signalSubscriptionWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsSubscriptionWorkflowServiceApi.SignalSubscriptionWorkflowRequest.fromPartial({ subscriptionId: record.message })));
  }
}

/**
 * Reads acme.inventory.v1.StockItemQueryService/LookupStockItem and hands what it keeps to the sink of its
 * kind.
 */
export async function propagateStockItemMessage(runtime: Runtime): Promise<void> {
  const origin = new inventoryStockItemQueryServiceApi.StockItemQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<inventoryStockItemQueryServiceApi.LookupStockItemRequest, inventoryStockItemQueryServiceApi.LookupStockItemResponse>(
    (request, done) => origin.lookupStockItem(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    inventoryStockItemQueryServiceApi.LookupStockItemRequest.fromPartial({ stockItemId: "primary-propagate-stock-item-message" }));
  const row: PropagateStockItemMessageRecord = {
    message: response.result?.message ?? "",
    stockItemId: response.stockItem?.stockItemId ?? "",
  };
  const sinks: PropagateStockItemMessageDestination[] = [
    new PropagateStockItemMessageRegisteredModelQuery(runtime),
    new PropagateStockItemMessageTranslationKeyWorkflow(runtime),
    new PropagateStockItemMessageSubscriptionWorkflow(runtime),
  ];
  for (const sink of sinks) {
    await sink.deliver(row);
  }
}
