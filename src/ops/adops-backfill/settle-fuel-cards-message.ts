import * as fleetVehicleQueryServiceApi from "../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as fuelFuelCardQueryServiceApi from "../../../.cache/proto/acme/fuel/v1/fuel_card_query_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as surveysSurveyWorkflowServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_workflow_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleFuelCardsMessage keeps of each ResolveFuelCards response. */
interface SettleFuelCardsMessageRecord {
  message: string;
  status: string;
  nextPageToken: string;
  correlationId: string;
}

/** Where settleFuelCardsMessage hands each record. */
interface SettleFuelCardsMessageDestination {
  send(record: SettleFuelCardsMessageRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.NotificationTemplateValidationService. */
class SettleFuelCardsMessageNotificationTemplateValidation implements SettleFuelCardsMessageDestination {
  private readonly client: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleFuelCardsMessageRecord): Promise<void> {
    await retry(() => call<notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesRequest, notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesResponse>(
      (request, done) => this.client.getNotificationTemplateRules(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationTemplateValidationServiceApi.GetNotificationTemplateRulesRequest.fromPartial({ notificationTemplateId: record.status })));
  }
}

/** Writes records to acme.surveys.v1.SurveyWorkflowService. */
class SettleFuelCardsMessageSurveyWorkflow implements SettleFuelCardsMessageDestination {
  private readonly client: surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyWorkflowServiceApi.SurveyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleFuelCardsMessageRecord): Promise<void> {
    await call<surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowRequest, surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowResponse>(
      (request, done) => this.client.cancelSurveyWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyWorkflowServiceApi.CancelSurveyWorkflowRequest.fromPartial({ survey: { surveyId: record.message, number: record.status } }));
  }
}

/** Hands records to acme.fleet.v1.VehicleQueryService. */
class SettleFuelCardsMessageVehicleQuery implements SettleFuelCardsMessageDestination {
  private readonly client: fleetVehicleQueryServiceApi.VehicleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fleetVehicleQueryServiceApi.VehicleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: SettleFuelCardsMessageRecord): Promise<void> {
    await call<fleetVehicleQueryServiceApi.LookupVehicleRequest, fleetVehicleQueryServiceApi.LookupVehicleResponse>(
      (request, done) => this.client.lookupVehicle(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fleetVehicleQueryServiceApi.LookupVehicleRequest.fromPartial({ vehicleId: record.nextPageToken }));
  }
}

/** Reads acme.fuel.v1.FuelCardQueryService/ResolveFuelCards and hands what it keeps to the sink of its kind. */
export async function settleFuelCardsMessage(runtime: Runtime): Promise<void> {
  const source = new fuelFuelCardQueryServiceApi.FuelCardQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest, fuelFuelCardQueryServiceApi.ResolveFuelCardsResponse>(
    (request, done) => source.resolveFuelCards(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    fuelFuelCardQueryServiceApi.ResolveFuelCardsRequest.fromPartial({}));
  const row: SettleFuelCardsMessageRecord = {
    message: text.normalize(reply.result?.message ?? ""),
    status: reply.result?.status ?? "",
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    correlationId: text.normalize(reply.result?.correlationId ?? ""),
  };
  const sinks = new Map<string, SettleFuelCardsMessageDestination>([
    ["notification-template-validation", new SettleFuelCardsMessageNotificationTemplateValidation(runtime)],
    ["survey-workflow", new SettleFuelCardsMessageSurveyWorkflow(runtime)],
    ["vehicle-query", new SettleFuelCardsMessageVehicleQuery(runtime)],
  ]);
  const sink = sinks.get(process.env["SETTLE_FUEL_CARDS_MESSAGE_TARGET"] ?? "");
  if (!sink) return;
  await sink.send(row);
}
