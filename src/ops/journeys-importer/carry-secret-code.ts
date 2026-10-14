import * as admissionsAdmissionCalculationServiceApi from "../../../.cache/proto/acme/admissions/v1/admission_calculation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as secretsSecretServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_service.js";
import * as webhooksWebhookDeliveryWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_delivery_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carrySecretCode keeps of each CreateSecret response. */
interface CarrySecretCodeRecord {
  currencyCode: string;
  secretId: string;
  correlationId: string;
}

/** Where carrySecretCode hands each record. */
interface CarrySecretCodeSink {
  send(record: CarrySecretCodeRecord): Promise<void>;
}

/** Writes records to acme.personalization.v1.RecommendationQueryService. */
class CarrySecretCodeRecommendationQuery implements CarrySecretCodeSink {
  private readonly client: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarrySecretCodeRecord): Promise<void> {
    await call<personalizationRecommendationQueryServiceApi.FindRecommendationsRequest, personalizationRecommendationQueryServiceApi.FindRecommendationsResponse>(
      (request, done) => this.client.findRecommendations(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationRecommendationQueryServiceApi.FindRecommendationsRequest.fromPartial({ page: { pageToken: record.currencyCode }, orderBy: record.secretId }));
  }
}

/** Passes records to acme.admissions.v1.AdmissionCalculationService. */
class CarrySecretCodeAdmissionCalculation implements CarrySecretCodeSink {
  private readonly client: admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new admissionsAdmissionCalculationServiceApi.AdmissionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarrySecretCodeRecord): Promise<void> {
    await call<admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest, admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationResponse>(
      (request, done) => this.client.explainAdmissionCalculation(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      admissionsAdmissionCalculationServiceApi.ExplainAdmissionCalculationRequest.fromPartial({ admission: { correlationId: record.correlationId } }));
  }
}

/** Writes records to acme.webhooks.v1.WebhookDeliveryWorkflowService. */
class CarrySecretCodeWebhookDeliveryWorkflow implements CarrySecretCodeSink {
  private readonly client: webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookDeliveryWorkflowServiceApi.WebhookDeliveryWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarrySecretCodeRecord): Promise<void> {
    await call<webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest, webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowResponse>(
      (request, done) => this.client.resumeWebhookDeliveryWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookDeliveryWorkflowServiceApi.ResumeWebhookDeliveryWorkflowRequest.fromPartial({ webhookDelivery: { webhookDeliveryId: record.secretId }, details: { step: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarrySecretCodeLogOnly implements CarrySecretCodeSink {
  async send(record: CarrySecretCodeRecord): Promise<void> {
    console.info("no sink for record", record.currencyCode);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCarrySecretCode(kind: string, record: CarrySecretCodeRecord, runtime: Runtime): Promise<void> {
  let sink: CarrySecretCodeSink = new CarrySecretCodeLogOnly();
  switch (kind) {
    case "recommendation-query":
      sink = new CarrySecretCodeRecommendationQuery(runtime);
      break;
    case "admission-calculation":
      sink = new CarrySecretCodeAdmissionCalculation(runtime);
      break;
    case "webhook-delivery-workflow":
      sink = new CarrySecretCodeWebhookDeliveryWorkflow(runtime);
      break;
  }
  await sink.send(record);
}

/** Reads acme.secrets.v1.SecretService/CreateSecret and hands what it keeps to the sink of its kind. */
export async function carrySecretCode(runtime: Runtime): Promise<void> {
  const upstream = new secretsSecretServiceApi.SecretServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<secretsSecretServiceApi.CreateSecretRequest, secretsSecretServiceApi.CreateSecretResponse>(
    (request, done) => upstream.createSecret(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    secretsSecretServiceApi.CreateSecretRequest.fromPartial({ requestId: "current-carry-secret-code" }));
  const record: CarrySecretCodeRecord = {
    currencyCode: response.secret?.currencyCode ?? "",
    secretId: text.normalize(response.secret?.secretId ?? ""),
    correlationId: text.normalize(response.result?.correlationId ?? ""),
  };
  await deliverCarrySecretCode("webhook-delivery-workflow", record, runtime);
}
