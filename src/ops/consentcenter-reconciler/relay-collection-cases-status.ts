import * as collectionsCollectionCaseQueryServiceApi from "../../../.cache/proto/acme/collections/v1/collection_case_query_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as mediaMediaAssetLifecycleServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_lifecycle_service.js";
import * as notificationsNotificationTemplateQueryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayCollectionCasesStatus keeps of each FindCollectionCases response. */
interface RelayCollectionCasesStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
  message: string;
}

/** Where relayCollectionCasesStatus hands each record. */
interface RelayCollectionCasesStatusTarget {
  push(record: RelayCollectionCasesStatusRecord): Promise<void>;
}

/** Passes records to acme.media.v1.MediaAssetLifecycleService. */
class RelayCollectionCasesStatusMediaAssetLifecycle implements RelayCollectionCasesStatusTarget {
  private readonly client: mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetLifecycleServiceApi.MediaAssetLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayCollectionCasesStatusRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest, mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetResponse>(
      (request, done) => this.client.activateMediaAsset(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaMediaAssetLifecycleServiceApi.ActivateMediaAssetRequest.fromPartial({ details: { reasonCode: record.status } })));
  }
}

/** Sends records to acme.experiments.v1.ExposureCalculationService. */
class RelayCollectionCasesStatusExposureCalculation implements RelayCollectionCasesStatusTarget {
  private readonly client: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayCollectionCasesStatusRecord): Promise<void> {
    await retry(() => call<experimentsExposureCalculationServiceApi.EstimateExposureRequest, experimentsExposureCalculationServiceApi.EstimateExposureResponse>(
      (request, done) => this.client.estimateExposure(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExposureCalculationServiceApi.EstimateExposureRequest.fromPartial({ reason: record.nextPageToken })));
  }
}

/** Passes records to acme.notifications.v1.NotificationTemplateQueryService. */
class RelayCollectionCasesStatusNotificationTemplateQuery implements RelayCollectionCasesStatusTarget {
  private readonly client: notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateQueryServiceApi.NotificationTemplateQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: RelayCollectionCasesStatusRecord): Promise<void> {
    await retry(() => call<notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateRequest, notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateResponse>(
      (request, done) => this.client.lookupNotificationTemplate(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsNotificationTemplateQueryServiceApi.LookupNotificationTemplateRequest.fromPartial({ notificationTemplateId: record.status })));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayCollectionCasesStatusLogOnly implements RelayCollectionCasesStatusTarget {
  async push(record: RelayCollectionCasesStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverRelayCollectionCasesStatus(kind: string, record: RelayCollectionCasesStatusRecord, runtime: Runtime): Promise<void> {
  let sink: RelayCollectionCasesStatusTarget = new RelayCollectionCasesStatusLogOnly();
  switch (kind) {
    case "media-asset-lifecycle":
      sink = new RelayCollectionCasesStatusMediaAssetLifecycle(runtime);
      break;
    case "exposure-calculation":
      sink = new RelayCollectionCasesStatusExposureCalculation(runtime);
      break;
    case "notification-template-query":
      sink = new RelayCollectionCasesStatusNotificationTemplateQuery(runtime);
      break;
  }
  await sink.push(record);
}

/**
 * Reads acme.collections.v1.CollectionCaseQueryService/FindCollectionCases and hands what it keeps to the
 * sink of its kind.
 */
export async function relayCollectionCasesStatus(runtime: Runtime): Promise<void> {
  const source = new collectionsCollectionCaseQueryServiceApi.CollectionCaseQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<collectionsCollectionCaseQueryServiceApi.FindCollectionCasesRequest, collectionsCollectionCaseQueryServiceApi.FindCollectionCasesResponse>(
    (request, done) => source.findCollectionCases(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    collectionsCollectionCaseQueryServiceApi.FindCollectionCasesRequest.fromPartial({ orderBy: "nightly-relay-collection-cases-status" }));
  const kept: RelayCollectionCasesStatusRecord = {
    status: text.normalize(found.result?.status ?? ""),
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
    message: found.result?.message ?? "",
  };
  await deliverRelayCollectionCasesStatus("exposure-calculation", kept, runtime);
}
