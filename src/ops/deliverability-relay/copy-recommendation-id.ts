import * as localizationTranslationKeyServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as notificationsSubscriptionWorkflowServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_workflow_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import * as seatingSeatMapServiceApi from "../../../.cache/proto/acme/seating/v1/seat_map_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyRecommendationId keeps of each ActivateRecommendation response. */
interface CopyRecommendationIdRecord {
  correlationId: string;
  message: string;
}

/** Where copyRecommendationId hands each record. */
interface CopyRecommendationIdSink {
  apply(record: CopyRecommendationIdRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.TranslationKeyService. */
class CopyRecommendationIdTranslationKey implements CopyRecommendationIdSink {
  private readonly client: localizationTranslationKeyServiceApi.TranslationKeyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyServiceApi.TranslationKeyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyRecommendationIdRecord): Promise<void> {
    await retry(() => call<localizationTranslationKeyServiceApi.CreateTranslationKeyRequest, localizationTranslationKeyServiceApi.CreateTranslationKeyResponse>(
      (request, done) => this.client.createTranslationKey(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      localizationTranslationKeyServiceApi.CreateTranslationKeyRequest.fromPartial({ translationKey: { name: record.correlationId, code: record.message } })));
  }
}

/** Sends records to acme.seating.v1.SeatMapService. */
class CopyRecommendationIdSeatMap implements CopyRecommendationIdSink {
  private readonly client: seatingSeatMapServiceApi.SeatMapServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new seatingSeatMapServiceApi.SeatMapServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyRecommendationIdRecord): Promise<void> {
    await call<seatingSeatMapServiceApi.CloneSeatMapRequest, seatingSeatMapServiceApi.CloneSeatMapResponse>(
      (request, done) => this.client.cloneSeatMap(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      seatingSeatMapServiceApi.CloneSeatMapRequest.fromPartial({ seatMap: { seatMapId: record.message } }));
  }
}

/** Writes records to acme.notifications.v1.SubscriptionWorkflowService. */
class CopyRecommendationIdSubscriptionWorkflow implements CopyRecommendationIdSink {
  private readonly client: notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionWorkflowServiceApi.SubscriptionWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyRecommendationIdRecord): Promise<void> {
    await call<notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest, notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsResponse>(
      (request, done) => this.client.listSubscriptionWorkflows(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      notificationsSubscriptionWorkflowServiceApi.ListSubscriptionWorkflowsRequest.fromPartial({ page: { pageToken: record.correlationId } }));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyRecommendationId(kind: string, record: CopyRecommendationIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "translation-key": () => new CopyRecommendationIdTranslationKey(runtime).apply(record),
    "seat-map": () => new CopyRecommendationIdSeatMap(runtime).apply(record),
    "subscription-workflow": () => new CopyRecommendationIdSubscriptionWorkflow(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.personalization.v1.RecommendationLifecycleService/ActivateRecommendation and hands what it keeps
 * to the sink of its kind.
 */
export async function copyRecommendationId(runtime: Runtime): Promise<void> {
  const origin = new personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ActivateRecommendationResponse>(
    (request, done) => origin.activateRecommendation(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    personalizationRecommendationLifecycleServiceApi.ActivateRecommendationRequest.fromPartial({ reason: "live-copy-recommendation-id" }));
  const record: CopyRecommendationIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: reply.outcome?.message ?? "",
  };
  await actOnCopyRecommendationId("translation-key", record, runtime);
}
