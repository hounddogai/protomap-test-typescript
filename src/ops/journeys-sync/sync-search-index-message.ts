import * as notificationsSubscriptionAdminServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_admin_service.js";
import * as patientappPatientHomeServiceApi from "../../../.cache/proto/acme/patientapp/v1/patient_home_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncSearchIndexMessage keeps of each ValidateSearchIndex response. */
interface SyncSearchIndexMessageRecord {
  message: string;
  outcomeMessage: string;
  name: string;
}

/** Where syncSearchIndexMessage hands each record. */
interface SyncSearchIndexMessageTarget {
  deliver(record: SyncSearchIndexMessageRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.SubscriptionAdminService. */
class SyncSearchIndexMessageSubscriptionAdmin implements SyncSearchIndexMessageTarget {
  private readonly client: notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionAdminServiceApi.SubscriptionAdminServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncSearchIndexMessageRecord): Promise<void> {
    await call<notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest, notificationsSubscriptionAdminServiceApi.RestoreSubscriptionResponse>(
      (request, done) => this.client.restoreSubscription(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsSubscriptionAdminServiceApi.RestoreSubscriptionRequest.fromPartial({ reason: record.name, details: { reasonCode: record.message }, subscriptionId: record.outcomeMessage }));
  }
}

/** Passes records to acme.pipelines.v1.PipelineCalculationService. */
class SyncSearchIndexMessagePipelineCalculation implements SyncSearchIndexMessageTarget {
  private readonly client: pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncSearchIndexMessageRecord): Promise<void> {
    await retry(() => call<pipelinesPipelineCalculationServiceApi.RecalculatePipelinesRequest, pipelinesPipelineCalculationServiceApi.RecalculatePipelinesResponse>(
      (request, done) => this.client.recalculatePipelines(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      pipelinesPipelineCalculationServiceApi.RecalculatePipelinesRequest.fromPartial({ reason: record.outcomeMessage })));
  }
}

/** Writes records to acme.patientapp.v1.PatientHomeService. */
class SyncSearchIndexMessagePatientHome implements SyncSearchIndexMessageTarget {
  private readonly client: patientappPatientHomeServiceApi.PatientHomeServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new patientappPatientHomeServiceApi.PatientHomeServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: SyncSearchIndexMessageRecord): Promise<void> {
    await call<patientappPatientHomeServiceApi.GetPatientHomeRequest, patientappPatientHomeServiceApi.GetPatientHomeResponse>(
      (request, done) => this.client.getPatientHome(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      patientappPatientHomeServiceApi.GetPatientHomeRequest.fromPartial({ patientHomeId: record.message }));
  }
}

/**
 * Reads acme.search.v1.SearchIndexValidationService/ValidateSearchIndex and hands what it keeps to the sink
 * of its kind.
 */
export async function syncSearchIndexMessage(runtime: Runtime): Promise<void> {
  const origin = new searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<searchSearchIndexValidationServiceApi.ValidateSearchIndexRequest, searchSearchIndexValidationServiceApi.ValidateSearchIndexResponse>(
    (request, done) => origin.validateSearchIndex(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    searchSearchIndexValidationServiceApi.ValidateSearchIndexRequest.fromPartial({ searchIndexId: "default-sync-search-index-message" })));
  const record: SyncSearchIndexMessageRecord = {
    message: response.result?.message ?? "",
    outcomeMessage: text.normalize(response.outcome?.message ?? ""),
    name: response.searchIndex?.name ?? "",
  };
  const sinks = new Map<string, SyncSearchIndexMessageTarget>([
    ["subscription-admin", new SyncSearchIndexMessageSubscriptionAdmin(runtime)],
    ["pipeline-calculation", new SyncSearchIndexMessagePipelineCalculation(runtime)],
    ["patient-home", new SyncSearchIndexMessagePatientHome(runtime)],
  ]);
  const sink = sinks.get(process.env["SYNC_SEARCH_INDEX_MESSAGE_TARGET"] ?? "");
  if (!sink) return;
  await sink.deliver(record);
}
