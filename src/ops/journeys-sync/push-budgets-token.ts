import * as budgetingBudgetQueryServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as labelingLabelingTaskServiceApi from "../../../.cache/proto/acme/labeling/v1/labeling_task_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as sponsorshipsSponsorCalculationServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushBudgetsToken keeps of each ResolveBudgets response. */
interface PushBudgetsTokenRecord {
  nextPageToken: string;
  correlationId: string;
  message: string;
  status: string;
}

/** Where pushBudgetsToken hands each record. */
interface PushBudgetsTokenTarget {
  deliver(record: PushBudgetsTokenRecord): Promise<void>;
}

/** Sends records to acme.sponsorships.v1.SponsorCalculationService. */
class PushBudgetsTokenSponsorCalculation implements PushBudgetsTokenTarget {
  private readonly client: sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorCalculationServiceApi.SponsorCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushBudgetsTokenRecord): Promise<void> {
    await call<sponsorshipsSponsorCalculationServiceApi.CalculateSponsorRequest, sponsorshipsSponsorCalculationServiceApi.CalculateSponsorResponse>(
      (request, done) => this.client.calculateSponsor(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      sponsorshipsSponsorCalculationServiceApi.CalculateSponsorRequest.fromPartial({ sponsorId: record.status, reason: record.nextPageToken }));
  }
}

/** Hands records to acme.labeling.v1.LabelingTaskService. */
class PushBudgetsTokenLabelingTask implements PushBudgetsTokenTarget {
  private readonly client: labelingLabelingTaskServiceApi.LabelingTaskServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new labelingLabelingTaskServiceApi.LabelingTaskServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushBudgetsTokenRecord): Promise<void> {
    await call<labelingLabelingTaskServiceApi.GetLabelingTaskRequest, labelingLabelingTaskServiceApi.GetLabelingTaskResponse>(
      (request, done) => this.client.getLabelingTask(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      labelingLabelingTaskServiceApi.GetLabelingTaskRequest.fromPartial({ labelingTaskId: record.nextPageToken }));
  }
}

/** Passes records to acme.notifications.v1.NotificationTemplateHistoryService. */
class PushBudgetsTokenNotificationTemplateHistory implements PushBudgetsTokenTarget {
  private readonly client: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushBudgetsTokenRecord): Promise<void> {
    await call<notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest, notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsResponse>(
      (request, done) => this.client.compareNotificationTemplateVersions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsNotificationTemplateHistoryServiceApi.CompareNotificationTemplateVersionsRequest.fromPartial({ notificationTemplate: { notes: record.status }, details: { authorEmail: record.correlationId }, reason: record.message }));
  }
}

/** Reads acme.budgeting.v1.BudgetQueryService/ResolveBudgets and hands what it keeps to the sink of its kind. */
export async function pushBudgetsToken(runtime: Runtime): Promise<void> {
  const origin = new budgetingBudgetQueryServiceApi.BudgetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<budgetingBudgetQueryServiceApi.ResolveBudgetsRequest, budgetingBudgetQueryServiceApi.ResolveBudgetsResponse>(
    (request, done) => origin.resolveBudgets(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    budgetingBudgetQueryServiceApi.ResolveBudgetsRequest.fromPartial({})));
  const kept: PushBudgetsTokenRecord = {
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
    correlationId: found.result?.correlationId ?? "",
    message: found.result?.message ?? "",
    status: found.result?.status ?? "",
  };
  const sinks: PushBudgetsTokenTarget[] = [
    new PushBudgetsTokenSponsorCalculation(runtime),
    new PushBudgetsTokenLabelingTask(runtime),
    new PushBudgetsTokenNotificationTemplateHistory(runtime),
  ];
  await sinks[2]!.deliver(kept);
}
