import * as audiencesAudienceMemberWorkflowServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as localizationLocaleApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/locale_approval_service.js";
import * as metricsMetricSeriesServiceApi from "../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as showsShowCalculationServiceApi from "../../../.cache/proto/acme/shows/v1/show_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushAudienceMemberWorkflowStatus keeps of each PauseAudienceMemberWorkflow response. */
interface PushAudienceMemberWorkflowStatusRecord {
  status: string;
  message: string;
}

/** Where pushAudienceMemberWorkflowStatus hands each record. */
interface PushAudienceMemberWorkflowStatusDestination {
  apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void>;
}

/** Sends records to acme.fleet.v1.VehicleQueryService. */
class PushAudienceMemberWorkflowStatusVehicleQuery implements PushAudienceMemberWorkflowStatusDestination {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.LookupVehicleRequest, fleetVehicleQueryServiceApi.LookupVehicleResponse>(
      (request, done) => this.client.lookupVehicle(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fleetVehicleQueryServiceApi.LookupVehicleRequest.fromPartial({ vehicleId: record.status }));
  }
}

/** Sends records to acme.metrics.v1.MetricSeriesService. */
class PushAudienceMemberWorkflowStatusMetricSeries implements PushAudienceMemberWorkflowStatusDestination {
  private readonly client: metricsMetricSeriesServiceApi.MetricSeriesServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new metricsMetricSeriesServiceApi.MetricSeriesServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void> {
    await call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(
      (request, done) => this.client.cloneMetricSeries(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({ metricSeries: { metricSeriesId: record.message } }));
  }
}

/** Passes records to acme.localization.v1.LocaleApprovalService. */
class PushAudienceMemberWorkflowStatusLocaleApproval implements PushAudienceMemberWorkflowStatusDestination {
  private readonly client: localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationLocaleApprovalServiceApi.LocaleApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void> {
    await retry(() => call<localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest, localizationLocaleApprovalServiceApi.CommentLocaleApprovalResponse>(
      (request, done) => this.client.commentLocaleApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      localizationLocaleApprovalServiceApi.CommentLocaleApprovalRequest.fromPartial({ locale: { description: record.message }, localeId: record.status })));
  }
}

/** Hands records to acme.shows.v1.ShowCalculationService. */
class PushAudienceMemberWorkflowStatusShowCalculation implements PushAudienceMemberWorkflowStatusDestination {
  private readonly client: showsShowCalculationServiceApi.ShowCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new showsShowCalculationServiceApi.ShowCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void> {
    await call<showsShowCalculationServiceApi.QuoteShowRequest, showsShowCalculationServiceApi.QuoteShowResponse>(
      (request, done) => this.client.quoteShow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      showsShowCalculationServiceApi.QuoteShowRequest.fromPartial({ show: { showId: record.status }, showId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushAudienceMemberWorkflowStatusLogOnly implements PushAudienceMemberWorkflowStatusDestination {
  async apply(record: PushAudienceMemberWorkflowStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPushAudienceMemberWorkflowStatus(kind: string, record: PushAudienceMemberWorkflowStatusRecord, runtime: Runtime): Promise<void> {
  let sink: PushAudienceMemberWorkflowStatusDestination = new PushAudienceMemberWorkflowStatusLogOnly();
  switch (kind) {
    case "vehicle-query":
      sink = new PushAudienceMemberWorkflowStatusVehicleQuery(runtime);
      break;
    case "metric-series":
      sink = new PushAudienceMemberWorkflowStatusMetricSeries(runtime);
      break;
    case "locale-approval":
      sink = new PushAudienceMemberWorkflowStatusLocaleApproval(runtime);
      break;
    case "show-calculation":
      sink = new PushAudienceMemberWorkflowStatusShowCalculation(runtime);
      break;
  }
  await sink.apply(record);
}

/**
 * Reads acme.audiences.v1.AudienceMemberWorkflowService/PauseAudienceMemberWorkflow and hands what it keeps
 * to the sink of its kind.
 */
export async function pushAudienceMemberWorkflowStatus(runtime: Runtime): Promise<void> {
  const source = new audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowResponse>(
    (request, done) => source.pauseAudienceMemberWorkflow(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    audiencesAudienceMemberWorkflowServiceApi.PauseAudienceMemberWorkflowRequest.fromPartial({ audienceMemberId: "nightly-push-audience-member-workflow-status" }));
  const row: PushAudienceMemberWorkflowStatusRecord = {
    status: response.outcome?.status ?? "",
    message: response.result?.message ?? "",
  };
  await deliverPushAudienceMemberWorkflowStatus("metric-series", row, runtime);
}
