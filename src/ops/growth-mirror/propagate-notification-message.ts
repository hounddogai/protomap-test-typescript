import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as experimentsVariantSyncServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_sync_service.js";
import * as notificationsNotificationValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/notification_validation_service.js";
import * as workplacesBuildingCalculationServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateNotificationMessage keeps of each ScoreNotification response. */
interface PropagateNotificationMessageRecord {
  message: string;
  currencyCode: string;
  notificationId: string;
}

/** Where propagateNotificationMessage hands each record. */
interface PropagateNotificationMessageDestination {
  write(record: PropagateNotificationMessageRecord): Promise<void>;
}

/** Sends records to acme.experiments.v1.VariantSyncService. */
class PropagateNotificationMessageVariantSync implements PropagateNotificationMessageDestination {
  private readonly client: experimentsVariantSyncServiceApi.VariantSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantSyncServiceApi.VariantSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateNotificationMessageRecord): Promise<void> {
    await retry(() => call<experimentsVariantSyncServiceApi.ListVariantConflictsRequest, experimentsVariantSyncServiceApi.ListVariantConflictsResponse>(
      (request, done) => this.client.listVariantConflicts(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsVariantSyncServiceApi.ListVariantConflictsRequest.fromPartial({ filter: { ownerId: record.currencyCode }, page: { pageToken: record.notificationId } })));
  }
}

/** Hands records to acme.audiences.v1.AudienceMemberApprovalService. */
class PropagateNotificationMessageAudienceMemberApproval implements PropagateNotificationMessageDestination {
  private readonly client: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateNotificationMessageRecord): Promise<void> {
    await call<audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberResponse>(
      (request, done) => this.client.submitAudienceMember(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceMemberApprovalServiceApi.SubmitAudienceMemberRequest.fromPartial({ details: { approverEmail: record.message }, audienceMember: { audienceMemberId: record.notificationId } }));
  }
}

/** Sends records to acme.workplaces.v1.BuildingCalculationService. */
class PropagateNotificationMessageBuildingCalculation implements PropagateNotificationMessageDestination {
  private readonly client: workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new workplacesBuildingCalculationServiceApi.BuildingCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateNotificationMessageRecord): Promise<void> {
    await call<workplacesBuildingCalculationServiceApi.EstimateBuildingRequest, workplacesBuildingCalculationServiceApi.EstimateBuildingResponse>(
      (request, done) => this.client.estimateBuilding(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      workplacesBuildingCalculationServiceApi.EstimateBuildingRequest.fromPartial({ building: { buildingId: record.message } }));
  }
}

/**
 * Reads acme.notifications.v1.NotificationValidationService/ScoreNotification and hands what it keeps to the
 * sink of its kind.
 */
export async function propagateNotificationMessage(runtime: Runtime): Promise<void> {
  const origin = new notificationsNotificationValidationServiceApi.NotificationValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<notificationsNotificationValidationServiceApi.ScoreNotificationRequest, notificationsNotificationValidationServiceApi.ScoreNotificationResponse>(
    (request, done) => origin.scoreNotification(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    notificationsNotificationValidationServiceApi.ScoreNotificationRequest.fromPartial({ reason: "current-propagate-notification-message" })));
  const row: PropagateNotificationMessageRecord = {
    message: current.result?.message ?? "",
    currencyCode: current.breakdown?.currencyCode ?? "",
    notificationId: text.normalize(current.notification?.notificationId ?? ""),
  };
  const sinks: PropagateNotificationMessageDestination[] = [
    new PropagateNotificationMessageVariantSync(runtime),
    new PropagateNotificationMessageAudienceMemberApproval(runtime),
    new PropagateNotificationMessageBuildingCalculation(runtime),
  ];
  await sinks[1]!.write(row);
}
