import * as driverappDriverHomeQueryServiceApi from "../../../.cache/proto/acme/driverapp/v1/driver_home_query_service.js";
import * as personalizationProfileQueryServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_query_service.js";
import * as surveysSurveyQueryServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_query_service.js";
import * as webhooksWebhookSecretWorkflowServiceApi from "../../../.cache/proto/acme/webhooks/v1/webhook_secret_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carrySurveysToken keeps of each SuggestSurveys response. */
interface CarrySurveysTokenRecord {
  nextPageToken: string;
  status: string;
}

/** Where carrySurveysToken hands each record. */
interface CarrySurveysTokenDestination {
  apply(record: CarrySurveysTokenRecord): Promise<void>;
}

/** Hands records to acme.personalization.v1.ProfileQueryService. */
class CarrySurveysTokenProfileQuery implements CarrySurveysTokenDestination {
  private readonly client: personalizationProfileQueryServiceApi.ProfileQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileQueryServiceApi.ProfileQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarrySurveysTokenRecord): Promise<void> {
    await call<personalizationProfileQueryServiceApi.PeekProfileRequest, personalizationProfileQueryServiceApi.PeekProfileResponse>(
      (request, done) => this.client.peekProfile(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationProfileQueryServiceApi.PeekProfileRequest.fromPartial({ profileId: record.status }));
  }
}

/** Hands records to acme.driverapp.v1.DriverHomeQueryService. */
class CarrySurveysTokenDriverHomeQuery implements CarrySurveysTokenDestination {
  private readonly client: driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new driverappDriverHomeQueryServiceApi.DriverHomeQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarrySurveysTokenRecord): Promise<void> {
    await call<driverappDriverHomeQueryServiceApi.BrowseDriverHomesRequest, driverappDriverHomeQueryServiceApi.BrowseDriverHomesResponse>(
      (request, done) => this.client.browseDriverHomes(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      driverappDriverHomeQueryServiceApi.BrowseDriverHomesRequest.fromPartial({ orderBy: record.nextPageToken }));
  }
}

/** Hands records to acme.webhooks.v1.WebhookSecretWorkflowService. */
class CarrySurveysTokenWebhookSecretWorkflow implements CarrySurveysTokenDestination {
  private readonly client: webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webhooksWebhookSecretWorkflowServiceApi.WebhookSecretWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CarrySurveysTokenRecord): Promise<void> {
    await retry(() => call<webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest, webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowResponse>(
      (request, done) => this.client.advanceWebhookSecretWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      webhooksWebhookSecretWorkflowServiceApi.AdvanceWebhookSecretWorkflowRequest.fromPartial({ webhookSecret: { webhookSecretId: record.nextPageToken }, details: { step: record.status } })));
  }
}

/** Reads acme.surveys.v1.SurveyQueryService/SuggestSurveys and hands what it keeps to the sink of its kind. */
export async function carrySurveysToken(runtime: Runtime): Promise<void> {
  const reader = new surveysSurveyQueryServiceApi.SurveyQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<surveysSurveyQueryServiceApi.SuggestSurveysRequest, surveysSurveyQueryServiceApi.SuggestSurveysResponse>(
    (request, done) => reader.suggestSurveys(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    surveysSurveyQueryServiceApi.SuggestSurveysRequest.fromPartial({ orderBy: "live-carry-surveys-token" })));
  const entry: CarrySurveysTokenRecord = {
    nextPageToken: text.normalize(reply.pageInfo?.nextPageToken ?? ""),
    status: text.normalize(reply.result?.status ?? ""),
  };
  const sinks = new Map<string, CarrySurveysTokenDestination>();
  sinks.set("profile-query", new CarrySurveysTokenProfileQuery(runtime));
  sinks.set("driver-home-query", new CarrySurveysTokenDriverHomeQuery(runtime));
  sinks.set("webhook-secret-workflow", new CarrySurveysTokenWebhookSecretWorkflow(runtime));
  await sinks.get("profile-query")!.apply(entry);
}
