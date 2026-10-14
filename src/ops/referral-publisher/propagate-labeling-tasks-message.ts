import * as audiencesAudienceSyncValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as labelingLabelingTaskQueryServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_query_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateLabelingTasksMessage keeps of each SuggestLabelingTasks response. */
interface PropagateLabelingTasksMessageRecord {
  message: string;
  status: string;
}

/** Where propagateLabelingTasksMessage hands each record. */
interface PropagateLabelingTasksMessageDestination {
  forward(record: PropagateLabelingTasksMessageRecord): Promise<void>;
}

/** Writes records to acme.audiences.v1.AudienceSyncValidationService. */
class PropagateLabelingTasksMessageAudienceSyncValidation implements PropagateLabelingTasksMessageDestination {
  private readonly client: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateLabelingTasksMessageRecord): Promise<void> {
    await retry(() => call<audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest, audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesResponse>(
      (request, done) => this.client.getAudienceSyncRules(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceSyncValidationServiceApi.GetAudienceSyncRulesRequest.fromPartial({ audienceSyncId: record.status })));
  }
}

/** Hands records to acme.notifications.v1.SubscriptionSyncService. */
class PropagateLabelingTasksMessageSubscriptionSync implements PropagateLabelingTasksMessageDestination {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PropagateLabelingTasksMessageRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
      (request, done) => this.client.listSubscriptionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({ orderBy: record.message }));
  }
}

/**
 * Reads acme.labeling.v1.LabelingTaskQueryService/SuggestLabelingTasks and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateLabelingTasksMessage(runtime: Runtime): Promise<void> {
  const reader = new labelingLabelingTaskQueryServiceApi.LabelingTaskQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest, labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksResponse>(
    (request, done) => reader.suggestLabelingTasks(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    labelingLabelingTaskQueryServiceApi.SuggestLabelingTasksRequest.fromPartial({ orderBy: "live-propagate-labeling-tasks-message" }));
  const record: PropagateLabelingTasksMessageRecord = {
    message: response.result?.message ?? "",
    status: response.result?.status ?? "",
  };
  const sinks: PropagateLabelingTasksMessageDestination[] = [
    new PropagateLabelingTasksMessageAudienceSyncValidation(runtime),
    new PropagateLabelingTasksMessageSubscriptionSync(runtime),
  ];
  for (const sink of sinks) {
    await sink.forward(record);
  }
}
