import * as appointmentsAppointmentServiceApi from "../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as personalizationRecommendationWorkflowServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffFeatureFlagsId keeps of each BrowseFeatureFlags response. */
interface HandOffFeatureFlagsIdRecord {
  correlationId: string;
  nextPageToken: string;
  message: string;
  status: string;
}

/** Where handOffFeatureFlagsId hands each record. */
interface HandOffFeatureFlagsIdDestination {
  push(record: HandOffFeatureFlagsIdRecord): Promise<void>;
}

/** Passes records to acme.personalization.v1.RecommendationWorkflowService. */
class HandOffFeatureFlagsIdRecommendationWorkflow implements HandOffFeatureFlagsIdDestination {
  private readonly client: personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationWorkflowServiceApi.RecommendationWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffFeatureFlagsIdRecord): Promise<void> {
    await call<personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest, personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowResponse>(
      (request, done) => this.client.retryRecommendationWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationRecommendationWorkflowServiceApi.RetryRecommendationWorkflowRequest.fromPartial({ recommendation: { number: record.correlationId }, recommendationId: record.message }));
  }
}

/** Hands records to acme.appointments.v1.AppointmentService. */
class HandOffFeatureFlagsIdAppointment implements HandOffFeatureFlagsIdDestination {
  private readonly client: appointmentsAppointmentServiceApi.AppointmentServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new appointmentsAppointmentServiceApi.AppointmentServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffFeatureFlagsIdRecord): Promise<void> {
    await call<appointmentsAppointmentServiceApi.ListAppointmentsRequest, appointmentsAppointmentServiceApi.ListAppointmentsResponse>(
      (request, done) => this.client.listAppointments(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      appointmentsAppointmentServiceApi.ListAppointmentsRequest.fromPartial({ filter: { region: record.message }, page: { pageToken: record.status } }));
  }
}

/**
 * Reads acme.featureflags.v1.FeatureFlagQueryService/BrowseFeatureFlags and hands what it keeps to the sink
 * of its kind.
 */
export async function handOffFeatureFlagsId(runtime: Runtime): Promise<void> {
  const reader = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsResponse>(
    (request, done) => reader.browseFeatureFlags(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    featureflagsFeatureFlagQueryServiceApi.BrowseFeatureFlagsRequest.fromPartial({ orderBy: "primary-hand-off-feature-flags-id" })));
  const entry: HandOffFeatureFlagsIdRecord = {
    correlationId: text.normalize(response.result?.correlationId ?? ""),
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    message: text.normalize(response.result?.message ?? ""),
    status: text.normalize(response.result?.status ?? ""),
  };
  const sinks = new Map<string, HandOffFeatureFlagsIdDestination>();
  sinks.set("recommendation-workflow", new HandOffFeatureFlagsIdRecommendationWorkflow(runtime));
  sinks.set("appointment", new HandOffFeatureFlagsIdAppointment(runtime));
  await sinks.get("recommendation-workflow")!.push(entry);
}
