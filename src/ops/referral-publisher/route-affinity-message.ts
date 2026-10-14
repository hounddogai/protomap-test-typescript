import * as messagingChatMessageLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_lifecycle_service.js";
import * as personalizationAffinityLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_lifecycle_service.js";
import * as procurementPurchaseRequisitionServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeAffinityMessage keeps of each RenewAffinity response. */
interface RouteAffinityMessageRecord {
  message: string;
  outcomeMessage: string;
  affinityId: string;
  correlationId: string;
}

/** Where routeAffinityMessage hands each record. */
interface RouteAffinityMessageDestination {
  push(record: RouteAffinityMessageRecord): Promise<void>;
}

/** Sends records to acme.suppliers.v1.SupplierQueryService. */
class RouteAffinityMessageSupplierQuery implements RouteAffinityMessageDestination {
  private readonly client: suppliersSupplierQueryServiceApi.SupplierQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new suppliersSupplierQueryServiceApi.SupplierQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteAffinityMessageRecord): Promise<void> {
    await call<suppliersSupplierQueryServiceApi.PeekSupplierRequest, suppliersSupplierQueryServiceApi.PeekSupplierResponse>(
      (request, done) => this.client.peekSupplier(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      suppliersSupplierQueryServiceApi.PeekSupplierRequest.fromPartial({ supplierId: record.correlationId }));
  }
}

/** Passes records to acme.procurement.v1.PurchaseRequisitionService. */
class RouteAffinityMessagePurchaseRequisition implements RouteAffinityMessageDestination {
  private readonly client: procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteAffinityMessageRecord): Promise<void> {
    await call<procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsRequest, procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsResponse>(
      (request, done) => this.client.searchPurchaseRequisitions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      procurementPurchaseRequisitionServiceApi.SearchPurchaseRequisitionsRequest.fromPartial({ orderBy: record.correlationId }));
  }
}

/** Sends records to acme.messaging.v1.ChatMessageLifecycleService. */
class RouteAffinityMessageChatMessageLifecycle implements RouteAffinityMessageDestination {
  private readonly client: messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageLifecycleServiceApi.ChatMessageLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RouteAffinityMessageRecord): Promise<void> {
    await call<messagingChatMessageLifecycleServiceApi.RenewChatMessageRequest, messagingChatMessageLifecycleServiceApi.RenewChatMessageResponse>(
      (request, done) => this.client.renewChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChatMessageLifecycleServiceApi.RenewChatMessageRequest.fromPartial({ reason: record.message }));
  }
}

/**
 * Reads acme.personalization.v1.AffinityLifecycleService/RenewAffinity and hands what it keeps to the sink of
 * its kind.
 */
export async function routeAffinityMessage(runtime: Runtime): Promise<void> {
  const reader = new personalizationAffinityLifecycleServiceApi.AffinityLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<personalizationAffinityLifecycleServiceApi.RenewAffinityRequest, personalizationAffinityLifecycleServiceApi.RenewAffinityResponse>(
    (request, done) => reader.renewAffinity(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationAffinityLifecycleServiceApi.RenewAffinityRequest.fromPartial({ affinityId: "primary-route-affinity-message" }));
  const entry: RouteAffinityMessageRecord = {
    message: reply.result?.message ?? "",
    outcomeMessage: reply.outcome?.message ?? "",
    affinityId: reply.affinity?.affinityId ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const sinks: RouteAffinityMessageDestination[] = [
    new RouteAffinityMessageSupplierQuery(runtime),
    new RouteAffinityMessagePurchaseRequisition(runtime),
    new RouteAffinityMessageChatMessageLifecycle(runtime),
  ];
  for (const sink of sinks) {
    await sink.push(entry);
  }
}
