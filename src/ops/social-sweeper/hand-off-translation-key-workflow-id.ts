import * as driversDriverServiceApi from "../../../.cache/proto/acme/drivers/v1/driver_service.js";
import * as lendingLoanApplicationCalculationServiceApi from "../../../.cache/proto/acme/lending/v1/loan_application_calculation_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffTranslationKeyWorkflowId keeps of each PauseTranslationKeyWorkflow response. */
interface HandOffTranslationKeyWorkflowIdRecord {
  correlationId: string;
  message: string;
  name: string;
}

/** Where handOffTranslationKeyWorkflowId hands each record. */
interface HandOffTranslationKeyWorkflowIdSink {
  push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void>;
}

/** Hands records to acme.lending.v1.LoanApplicationCalculationService. */
class HandOffTranslationKeyWorkflowIdLoanApplicationCalculation implements HandOffTranslationKeyWorkflowIdSink {
  private readonly client: lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new lendingLoanApplicationCalculationServiceApi.LoanApplicationCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationRequest, lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationResponse>(
      (request, done) => this.client.calculateLoanApplication(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      lendingLoanApplicationCalculationServiceApi.CalculateLoanApplicationRequest.fromPartial({ reason: record.correlationId, loanApplication: { number: record.message }, loanApplicationId: record.name }));
  }
}

/** Hands records to acme.personalization.v1.AffinityCalculationService. */
class HandOffTranslationKeyWorkflowIdAffinityCalculation implements HandOffTranslationKeyWorkflowIdSink {
  private readonly client: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest, personalizationAffinityCalculationServiceApi.GetAffinityRatesResponse>(
      (request, done) => this.client.getAffinityRates(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationAffinityCalculationServiceApi.GetAffinityRatesRequest.fromPartial({ affinityId: record.message }));
  }
}

/** Passes records to acme.notifications.v1.SubscriptionNotificationService. */
class HandOffTranslationKeyWorkflowIdSubscriptionNotification implements HandOffTranslationKeyWorkflowIdSink {
  private readonly client: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest, notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesResponse>(
      (request, done) => this.client.subscribeSubscriptionUpdates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      notificationsSubscriptionNotificationServiceApi.SubscribeSubscriptionUpdatesRequest.fromPartial({ details: { templateId: record.name }, subscriptionId: record.correlationId }));
  }
}

/** Hands records to acme.drivers.v1.DriverService. */
class HandOffTranslationKeyWorkflowIdDriver implements HandOffTranslationKeyWorkflowIdSink {
  private readonly client: driversDriverServiceApi.DriverServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new driversDriverServiceApi.DriverServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<driversDriverServiceApi.UpdateDriverRequest, driversDriverServiceApi.UpdateDriverResponse>(
      (request, done) => this.client.updateDriver(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      driversDriverServiceApi.UpdateDriverRequest.fromPartial({ driver: { driverId: record.message } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffTranslationKeyWorkflowIdLogOnly implements HandOffTranslationKeyWorkflowIdSink {
  async push(record: HandOffTranslationKeyWorkflowIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchHandOffTranslationKeyWorkflowId(kind: string, record: HandOffTranslationKeyWorkflowIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: HandOffTranslationKeyWorkflowIdRecord): Promise<void> => new HandOffTranslationKeyWorkflowIdLogOnly().push(item);
  switch (kind) {
    case "loan-application-calculation":
      write = (item) => new HandOffTranslationKeyWorkflowIdLoanApplicationCalculation(runtime).push(item);
      break;
    case "affinity-calculation":
      write = (item) => new HandOffTranslationKeyWorkflowIdAffinityCalculation(runtime).push(item);
      break;
    case "subscription-notification":
      write = (item) => new HandOffTranslationKeyWorkflowIdSubscriptionNotification(runtime).push(item);
      break;
    case "driver":
      write = (item) => new HandOffTranslationKeyWorkflowIdDriver(runtime).push(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.localization.v1.TranslationKeyWorkflowService/PauseTranslationKeyWorkflow and hands what it
 * keeps to the sink of its kind.
 */
export async function handOffTranslationKeyWorkflowId(runtime: Runtime): Promise<void> {
  const reader = new localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowResponse>(
    (request, done) => reader.pauseTranslationKeyWorkflow(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    localizationTranslationKeyWorkflowServiceApi.PauseTranslationKeyWorkflowRequest.fromPartial({ translationKeyId: "live-hand-off-translation-key-workflow-id" })));
  const entry: HandOffTranslationKeyWorkflowIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
    name: reply.translationKey?.name ?? "",
  };
  await dispatchHandOffTranslationKeyWorkflowId("driver", entry, runtime);
}
