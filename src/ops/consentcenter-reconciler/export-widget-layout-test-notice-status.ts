import * as authorizationAccessPolicyQueryServiceApi from "../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as experimentsExperimentLifecycleServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_lifecycle_service.js";
import * as schedulingShiftQueryServiceApi from "../../../.cache/proto/acme/scheduling/v1/shift_query_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportWidgetLayoutTestNoticeStatus keeps of each SendWidgetLayoutTestNotice response. */
interface ExportWidgetLayoutTestNoticeStatusRecord {
  status: string;
  referenceId: string;
}

/** Where exportWidgetLayoutTestNoticeStatus hands each record. */
interface ExportWidgetLayoutTestNoticeStatusDestination {
  apply(record: ExportWidgetLayoutTestNoticeStatusRecord): Promise<void>;
}

/** Hands records to acme.experiments.v1.ExperimentLifecycleService. */
class ExportWidgetLayoutTestNoticeStatusExperimentLifecycle implements ExportWidgetLayoutTestNoticeStatusDestination {
  private readonly client: experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentLifecycleServiceApi.ExperimentLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportWidgetLayoutTestNoticeStatusRecord): Promise<void> {
    await call<experimentsExperimentLifecycleServiceApi.RenewExperimentRequest, experimentsExperimentLifecycleServiceApi.RenewExperimentResponse>(
      (request, done) => this.client.renewExperiment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentLifecycleServiceApi.RenewExperimentRequest.fromPartial({ reason: record.status }));
  }
}

/** Writes records to acme.authorization.v1.AccessPolicyQueryService. */
class ExportWidgetLayoutTestNoticeStatusAccessPolicyQuery implements ExportWidgetLayoutTestNoticeStatusDestination {
  private readonly client: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportWidgetLayoutTestNoticeStatusRecord): Promise<void> {
    await call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(
      (request, done) => this.client.summarizeAccessPolicies(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({ details: { format: record.status }, accessPolicyId: record.referenceId }));
  }
}

/** Passes records to acme.scheduling.v1.ShiftQueryService. */
class ExportWidgetLayoutTestNoticeStatusShiftQuery implements ExportWidgetLayoutTestNoticeStatusDestination {
  private readonly client: schedulingShiftQueryServiceApi.ShiftQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new schedulingShiftQueryServiceApi.ShiftQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportWidgetLayoutTestNoticeStatusRecord): Promise<void> {
    await call<schedulingShiftQueryServiceApi.BrowseShiftsRequest, schedulingShiftQueryServiceApi.BrowseShiftsResponse>(
      (request, done) => this.client.browseShifts(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      schedulingShiftQueryServiceApi.BrowseShiftsRequest.fromPartial({ filter: { query: record.status } }));
  }
}

/** Runs the action registered for kind. */
async function actOnExportWidgetLayoutTestNoticeStatus(kind: string, record: ExportWidgetLayoutTestNoticeStatusRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "experiment-lifecycle": () => new ExportWidgetLayoutTestNoticeStatusExperimentLifecycle(runtime).apply(record),
    "access-policy-query": () => new ExportWidgetLayoutTestNoticeStatusAccessPolicyQuery(runtime).apply(record),
    "shift-query": () => new ExportWidgetLayoutTestNoticeStatusShiftQuery(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.webbff.v1.WidgetLayoutNotificationService/SendWidgetLayoutTestNotice and hands what it keeps to
 * the sink of its kind.
 */
export async function exportWidgetLayoutTestNoticeStatus(runtime: Runtime): Promise<void> {
  const upstream = new webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest, webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeResponse>(
    (request, done) => upstream.sendWidgetLayoutTestNotice(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    webbffWidgetLayoutNotificationServiceApi.SendWidgetLayoutTestNoticeRequest.fromPartial({ reason: "current-export-widget-layout-test-notice-status" }));
  const entry: ExportWidgetLayoutTestNoticeStatusRecord = {
    status: response.result?.status ?? "",
    referenceId: response.outcome?.referenceId ?? "",
  };
  await actOnExportWidgetLayoutTestNoticeStatus("experiment-lifecycle", entry, runtime);
}
