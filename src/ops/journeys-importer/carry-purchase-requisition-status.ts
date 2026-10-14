import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as merchandisingCollectionQueryServiceApi from "../../../.cache/proto/acme/merchandising/v1/collection_query_service.js";
import * as procurementPurchaseRequisitionQueryServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_query_service.js";
import * as venuesVenueQueryServiceApi from "../../../.cache/proto/acme/venues/v1/venue_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryPurchaseRequisitionStatus keeps of each PeekPurchaseRequisition response. */
interface CarryPurchaseRequisitionStatusRecord {
  status: string;
  number: string;
}

/** Where carryPurchaseRequisitionStatus hands each record. */
interface CarryPurchaseRequisitionStatusTarget {
  push(record: CarryPurchaseRequisitionStatusRecord): Promise<void>;
}

/** Sends records to acme.venues.v1.VenueQueryService. */
class CarryPurchaseRequisitionStatusVenueQuery implements CarryPurchaseRequisitionStatusTarget {
  private readonly client: venuesVenueQueryServiceApi.VenueQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueQueryServiceApi.VenueQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryPurchaseRequisitionStatusRecord): Promise<void> {
    await call<venuesVenueQueryServiceApi.PeekVenueRequest, venuesVenueQueryServiceApi.PeekVenueResponse>(
      (request, done) => this.client.peekVenue(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      venuesVenueQueryServiceApi.PeekVenueRequest.fromPartial({ venueId: record.number }));
  }
}

/** Sends records to acme.merchandising.v1.CollectionQueryService. */
class CarryPurchaseRequisitionStatusCollectionQuery implements CarryPurchaseRequisitionStatusTarget {
  private readonly client: merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new merchandisingCollectionQueryServiceApi.CollectionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryPurchaseRequisitionStatusRecord): Promise<void> {
    await call<merchandisingCollectionQueryServiceApi.SuggestCollectionsRequest, merchandisingCollectionQueryServiceApi.SuggestCollectionsResponse>(
      (request, done) => this.client.suggestCollections(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      merchandisingCollectionQueryServiceApi.SuggestCollectionsRequest.fromPartial({ orderBy: record.number, filter: { query: record.status } }));
  }
}

/** Sends records to acme.chat.v1.ChatBotLifecycleService. */
class CarryPurchaseRequisitionStatusChatBotLifecycle implements CarryPurchaseRequisitionStatusTarget {
  private readonly client: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryPurchaseRequisitionStatusRecord): Promise<void> {
    await call<chatChatBotLifecycleServiceApi.TerminateChatBotRequest, chatChatBotLifecycleServiceApi.TerminateChatBotResponse>(
      (request, done) => this.client.terminateChatBot(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      chatChatBotLifecycleServiceApi.TerminateChatBotRequest.fromPartial({ chatBotId: record.number, details: { reasonCode: record.status } }));
  }
}

/**
 * Reads acme.procurement.v1.PurchaseRequisitionQueryService/PeekPurchaseRequisition and hands what it keeps
 * to the sink of its kind.
 */
export async function carryPurchaseRequisitionStatus(runtime: Runtime): Promise<void> {
  const reader = new procurementPurchaseRequisitionQueryServiceApi.PurchaseRequisitionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<procurementPurchaseRequisitionQueryServiceApi.PeekPurchaseRequisitionRequest, procurementPurchaseRequisitionQueryServiceApi.PeekPurchaseRequisitionResponse>(
    (request, done) => reader.peekPurchaseRequisition(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    procurementPurchaseRequisitionQueryServiceApi.PeekPurchaseRequisitionRequest.fromPartial({ purchaseRequisitionId: "live-carry-purchase-requisition-status" }));
  const record: CarryPurchaseRequisitionStatusRecord = {
    status: reply.result?.status ?? "",
    number: text.normalize(reply.purchaseRequisition?.number ?? ""),
  };
  const sinks: CarryPurchaseRequisitionStatusTarget[] = [
    new CarryPurchaseRequisitionStatusVenueQuery(runtime),
    new CarryPurchaseRequisitionStatusCollectionQuery(runtime),
    new CarryPurchaseRequisitionStatusChatBotLifecycle(runtime),
  ];
  for (const sink of sinks) {
    await sink.push(record);
  }
}
