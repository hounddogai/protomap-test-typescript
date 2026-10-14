import * as contentContentBlockQueryServiceApi from "../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as forecastingDemandForecastQueryServiceApi from "../../../.cache/proto/acme/forecasting/v1/demand_forecast_query_service.js";
import * as messagingConversationValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_validation_service.js";
import * as personalizationProfileLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_lifecycle_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyConversationsSubject keeps of each LintConversations response. */
interface CopyConversationsSubjectRecord {
  subject: string;
  referenceId: string;
}

/** Where copyConversationsSubject hands each record. */
interface CopyConversationsSubjectWriter {
  apply(record: CopyConversationsSubjectRecord): Promise<void>;
}

/** Sends records to acme.forecasting.v1.DemandForecastQueryService. */
class CopyConversationsSubjectDemandForecastQuery implements CopyConversationsSubjectWriter {
  private readonly client: forecastingDemandForecastQueryServiceApi.DemandForecastQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new forecastingDemandForecastQueryServiceApi.DemandForecastQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyConversationsSubjectRecord): Promise<void> {
    await call<forecastingDemandForecastQueryServiceApi.CountDemandForecastsRequest, forecastingDemandForecastQueryServiceApi.CountDemandForecastsResponse>(
      (request, done) => this.client.countDemandForecasts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      forecastingDemandForecastQueryServiceApi.CountDemandForecastsRequest.fromPartial({ filter: { query: record.subject } }));
  }
}

/** Writes records to acme.content.v1.ContentBlockQueryService. */
class CopyConversationsSubjectContentBlockQuery implements CopyConversationsSubjectWriter {
  private readonly client: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyConversationsSubjectRecord): Promise<void> {
    await call<contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest, contentContentBlockQueryServiceApi.SummarizeContentBlocksResponse>(
      (request, done) => this.client.summarizeContentBlocks(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contentContentBlockQueryServiceApi.SummarizeContentBlocksRequest.fromPartial({ contentBlockId: record.subject, details: { cron: record.referenceId } }));
  }
}

/** Hands records to acme.webbff.v1.WidgetLayoutNotificationService. */
class CopyConversationsSubjectWidgetLayoutNotification implements CopyConversationsSubjectWriter {
  private readonly client: webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyConversationsSubjectRecord): Promise<void> {
    await retry(() => call<webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesRequest, webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesResponse>(
      (request, done) => this.client.getWidgetLayoutPreferences(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      webbffWidgetLayoutNotificationServiceApi.GetWidgetLayoutPreferencesRequest.fromPartial({ widgetLayoutId: record.referenceId })));
  }
}

/** Writes records to acme.personalization.v1.ProfileLifecycleService. */
class CopyConversationsSubjectProfileLifecycle implements CopyConversationsSubjectWriter {
  private readonly client: personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationProfileLifecycleServiceApi.ProfileLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyConversationsSubjectRecord): Promise<void> {
    await retry(() => call<personalizationProfileLifecycleServiceApi.ExpireProfileRequest, personalizationProfileLifecycleServiceApi.ExpireProfileResponse>(
      (request, done) => this.client.expireProfile(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      personalizationProfileLifecycleServiceApi.ExpireProfileRequest.fromPartial({ details: { reasonCode: record.referenceId }, profileId: record.subject })));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyConversationsSubject(kind: string, record: CopyConversationsSubjectRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "demand-forecast-query": () => new CopyConversationsSubjectDemandForecastQuery(runtime).apply(record),
    "content-block-query": () => new CopyConversationsSubjectContentBlockQuery(runtime).apply(record),
    "widget-layout-notification": () => new CopyConversationsSubjectWidgetLayoutNotification(runtime).apply(record),
    "profile-lifecycle": () => new CopyConversationsSubjectProfileLifecycle(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.messaging.v1.ConversationValidationService/LintConversations and hands what it keeps to the sink
 * of its kind.
 */
export async function copyConversationsSubject(runtime: Runtime): Promise<void> {
  const source = new messagingConversationValidationServiceApi.ConversationValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<messagingConversationValidationServiceApi.LintConversationsRequest, messagingConversationValidationServiceApi.LintConversationsResponse>(
    (request, done) => source.lintConversations(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingConversationValidationServiceApi.LintConversationsRequest.fromPartial({ conversationId: "main-copy-conversations-subject" }));
  const row: CopyConversationsSubjectRecord = {
    subject: found.conversation?.subject ?? "",
    referenceId: found.outcome?.referenceId ?? "",
  };
  await actOnCopyConversationsSubject("demand-forecast-query", row, runtime);
}
