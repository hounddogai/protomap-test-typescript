import * as audiencesAudienceWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_workflow_service.js";
import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as messagingConversationQueryServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_query_service.js";
import * as personalizationProfileQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateProfilesStatus keeps of each ResolveProfiles response. */
interface PropagateProfilesStatusRecord {
  status: string;
  nextPageToken: string;
  message: string;
}

/** Where propagateProfilesStatus hands each record. */
interface PropagateProfilesStatusWriter {
  write(record: PropagateProfilesStatusRecord): Promise<void>;
}

/** Writes records to acme.messaging.v1.ConversationQueryService. */
class PropagateProfilesStatusConversationQuery implements PropagateProfilesStatusWriter {
  private readonly client: messagingConversationQueryServiceApi.ConversationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingConversationQueryServiceApi.ConversationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateProfilesStatusRecord): Promise<void> {
    await retry(() => call<messagingConversationQueryServiceApi.BrowseConversationsRequest, messagingConversationQueryServiceApi.BrowseConversationsResponse>(
      (request, done) => this.client.browseConversations(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingConversationQueryServiceApi.BrowseConversationsRequest.fromPartial({ filter: { ownerId: record.status, region: record.nextPageToken }, page: { pageToken: record.message } })));
  }
}

/** Hands records to acme.audiences.v1.AudienceWorkflowService. */
class PropagateProfilesStatusAudienceWorkflow implements PropagateProfilesStatusWriter {
  private readonly client: audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceWorkflowServiceApi.AudienceWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateProfilesStatusRecord): Promise<void> {
    await call<audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowRequest, audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowResponse>(
      (request, done) => this.client.retryAudienceWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceWorkflowServiceApi.RetryAudienceWorkflowRequest.fromPartial({ audience: { description: record.status } }));
  }
}

/** Passes records to acme.keymanagement.v1.CryptoKeyCalculationService. */
class PropagateProfilesStatusCryptoKeyCalculation implements PropagateProfilesStatusWriter {
  private readonly client: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateProfilesStatusRecord): Promise<void> {
    await call<keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyResponse>(
      (request, done) => this.client.calculateCryptoKey(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      keymanagementCryptoKeyCalculationServiceApi.CalculateCryptoKeyRequest.fromPartial({ cryptoKey: { currencyCode: record.nextPageToken }, cryptoKeyId: record.message, details: { currencyCode: record.status } }));
  }
}

/** Sends records to acme.media.v1.MediaAssetLifecycleService. */
class PropagateProfilesStatusMediaAssetLifecycle implements PropagateProfilesStatusWriter {
  private readonly client: mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateProfilesStatusRecord): Promise<void> {
    await call<mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetResponse>(
      (request, done) => this.client.reinstateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaMediaAssetLifecycleServiceApi.ReinstateMediaAssetRequest.fromPartial({ mediaAssetId: record.nextPageToken, details: { reasonCode: record.status }, reason: record.message }));
  }
}

/** Runs the action registered for kind. */
async function actOnPropagateProfilesStatus(kind: string, record: PropagateProfilesStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "conversation-query": () => new PropagateProfilesStatusConversationQuery(runtime).write(record),
    "audience-workflow": () => new PropagateProfilesStatusAudienceWorkflow(runtime).write(record),
    "crypto-key-calculation": () => new PropagateProfilesStatusCryptoKeyCalculation(runtime).write(record),
    "media-asset-lifecycle": () => new PropagateProfilesStatusMediaAssetLifecycle(runtime).write(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.personalization.v1.ProfileQueryService/ResolveProfiles and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateProfilesStatus(runtime: Runtime): Promise<void> {
  const reader = new personalizationProfileQueryServiceApi.ProfileQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<personalizationProfileQueryServiceApi.ResolveProfilesRequest, personalizationProfileQueryServiceApi.ResolveProfilesResponse>(
    (request, done) => reader.resolveProfiles(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationProfileQueryServiceApi.ResolveProfilesRequest.fromPartial({}));
  const row: PropagateProfilesStatusRecord = {
    status: reply.result?.status ?? "",
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    message: reply.result?.message ?? "",
  };
  await actOnPropagateProfilesStatus("audience-workflow", row, runtime);
}
