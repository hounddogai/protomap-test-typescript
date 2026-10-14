import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as toursTourServiceApi from "../../../.cache/proto/acme/tours/v1/tour_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncConversationsMessage keeps of each BrowseConversations response. */
interface SyncConversationsMessageRecord {
  message: string;
  nextPageToken: string;
}

/** Where syncConversationsMessage hands each record. */
interface SyncConversationsMessageTarget {
  push(record: SyncConversationsMessageRecord): Promise<void>;
}

/** Hands records to acme.tours.v1.TourService. */
class SyncConversationsMessageTour implements SyncConversationsMessageTarget {
  private readonly client: toursTourServiceApi.TourServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new toursTourServiceApi.TourServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: SyncConversationsMessageRecord): Promise<void> {
    await call<toursTourServiceApi.CreateTourRequest, toursTourServiceApi.CreateTourResponse>(
      (request, done) => this.client.createTour(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      toursTourServiceApi.CreateTourRequest.fromPartial({ requestId: record.nextPageToken, tour: { title: record.message } }));
  }
}

/**
 * Reads acme.messaging.v1.ConversationQueryService/BrowseConversations and hands what it keeps to
 * acme.tours.v1.TourService.
 */
export async function syncConversationsMessage(runtime: Runtime): Promise<void> {
  const reader = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(
    (request, done) => reader.browseConversations(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingConversationQueryServiceApi.BrowseConversationsRequest.fromPartial({ orderBy: "nightly-sync-conversations-message" })));
  const kept: SyncConversationsMessageRecord = {
    message: current.result?.message ?? "",
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
  };
  await new SyncConversationsMessageTour(runtime).push(kept);
}
