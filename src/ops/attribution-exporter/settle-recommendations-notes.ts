import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as prescriptionsPrescriptionCalculationServiceApi from "../../../.cache/proto/acme/prescriptions/v1/prescription_calculation_service.js";
import * as webhooksWebhookEndpointWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_endpoint_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleRecommendationsNotes keeps of each RecalculateRecommendations response. */
interface SettleRecommendationsNotesRecord {
  notes: string;
  number: string;
  currencyCode: string;
  status: string;
}

/** Where settleRecommendationsNotes hands each record. */
interface SettleRecommendationsNotesTarget {
  forward(record: SettleRecommendationsNotesRecord): Promise<void>;
}

/** Hands records to acme.prescriptions.v1.PrescriptionCalculationService. */
class SettleRecommendationsNotesPrescriptionCalculation implements SettleRecommendationsNotesTarget {
  private readonly client: prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new prescriptionsPrescriptionCalculationServiceApi.PrescriptionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleRecommendationsNotesRecord): Promise<void> {
    await call<prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionRequest, prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionResponse>(
      (request, done) => this.client.simulatePrescription(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      prescriptionsPrescriptionCalculationServiceApi.SimulatePrescriptionRequest.fromPartial({ prescription: { notes: record.currencyCode, prescriptionId: record.notes }, details: { currencyCode: record.status } }));
  }
}

/** Hands records to acme.webhooks.v1.WebhookEndpointWorkflowService. */
class SettleRecommendationsNotesWebhookEndpointWorkflow implements SettleRecommendationsNotesTarget {
  private readonly client: webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookEndpointWorkflowServiceApi.WebhookEndpointWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleRecommendationsNotesRecord): Promise<void> {
    await call<webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest, webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowResponse>(
      (request, done) => this.client.cancelWebhookEndpointWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      webhooksWebhookEndpointWorkflowServiceApi.CancelWebhookEndpointWorkflowRequest.fromPartial({ webhookEndpoint: { code: record.number }, webhookEndpointId: record.status }));
  }
}

/** Hands records to acme.personalization.v1.ProfileCalculationService. */
class SettleRecommendationsNotesProfileCalculation implements SettleRecommendationsNotesTarget {
  private readonly client: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SettleRecommendationsNotesRecord): Promise<void> {
    await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(
      (request, done) => this.client.explainProfileCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({ profile: { profileId: record.currencyCode }, profileId: record.status }));
  }
}

/**
 * Reads acme.personalization.v1.RecommendationCalculationService/RecalculateRecommendations and hands what it
 * keeps to the sink of its kind.
 */
export async function settleRecommendationsNotes(runtime: Runtime): Promise<void> {
  const origin = new personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest, personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsResponse>(
    (request, done) => origin.recalculateRecommendations(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    personalizationRecommendationCalculationServiceApi.RecalculateRecommendationsRequest.fromPartial({ recommendationId: "nightly-settle-recommendations-notes" }));
  const row: SettleRecommendationsNotesRecord = {
    notes: response.recommendation?.notes ?? "",
    number: text.normalize(response.recommendation?.number ?? ""),
    currencyCode: response.breakdown?.currencyCode ?? "",
    status: response.result?.status ?? "",
  };
  const sinks = new Map<string, SettleRecommendationsNotesTarget>();
  sinks.set("prescription-calculation", new SettleRecommendationsNotesPrescriptionCalculation(runtime));
  sinks.set("webhook-endpoint-workflow", new SettleRecommendationsNotesWebhookEndpointWorkflow(runtime));
  sinks.set("profile-calculation", new SettleRecommendationsNotesProfileCalculation(runtime));
  await sinks.get("profile-calculation")!.forward(row);
}
