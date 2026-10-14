/**
 * Runs the long-lived workflow that takes a profile from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceSyncValidationServiceApi from "../../../../../.cache/proto/acme/audiences/v1/audience_sync_validation_service.js";
import * as communityForumApprovalServiceApi from "../../../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as notificationsNotificationNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/notification_notification_service.js";
import * as notificationsSubscriptionNotificationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_notification_service.js";
import * as performanceReviewQueryServiceApi from "../../../../../.cache/proto/acme/performance/v1/review_query_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as personalizationAffinityValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/affinity_validation_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationProfileReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_reporting_service.js";
import * as personalizationProfileWorkflowServiceApi from "../../../../../.cache/proto/acme/personalization/v1/profile_workflow_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../../platform/rpc.js";
import { collect, write } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toProfileRecord } from "../../data/records.js";
import { PersonalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileWorkflowWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceSyncValidationService") private readonly audiencesAudienceSyncValidationClient: audiencesAudienceSyncValidationServiceApi.AudienceSyncValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumApprovalService") private readonly communityForumApprovalClient: communityForumApprovalServiceApi.ForumApprovalServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationNotificationService") private readonly notificationsNotificationNotificationClient: notificationsNotificationNotificationServiceApi.NotificationNotificationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionNotificationService") private readonly notificationsSubscriptionNotificationClient: notificationsSubscriptionNotificationServiceApi.SubscriptionNotificationServiceClient,
    @inject("grpc:acme.performance.v1.ReviewQueryService") private readonly performanceReviewQueryClient: performanceReviewQueryServiceApi.ReviewQueryServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityReportingService") private readonly personalizationAffinityReportingClient: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient,
    @inject("grpc:acme.personalization.v1.AffinitySyncService") private readonly personalizationAffinitySyncClient: personalizationAffinitySyncServiceApi.AffinitySyncServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityValidationService") private readonly personalizationAffinityValidationClient: personalizationAffinityValidationServiceApi.AffinityValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileApprovalService") private readonly personalizationProfileApprovalClient: personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileReportingService") private readonly personalizationProfileReportingClient: personalizationProfileReportingServiceApi.ProfileReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a profile.
   */
  async advanceProfileWorkflow(req: personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "AdvanceProfileWorkflow", req);
    this.logger.info("advance_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_3: string | undefined;
    switch (req?.profile?.identityDocument?.$case) {
      case "nationalId":
        selected1_3 = ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.issuingCountry ?? "");
        break;
      default:
        selected1_3 = "";
    }
    const request1 = personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (req?.profile?.contact?.email ?? "") } },
      profile: {
        identityDocument: { $case: "passport", passport: { issuingCountry: (selected1_3 ?? "") } },
        primaryAddress: { postalCode: (req?.profile?.primaryAddress?.postalCode ?? "") },
        relationshipManager: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
    });
    const invoke1: Unary<personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest, personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse> =
      (input, done) => this.personalizationProfileApprovalClient.delegateProfileApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest, personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse>(invoke1, request1);
    const request2 = personalizationAffinityValidationServiceApi.PreviewAffinityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.profile?.contact?.phone ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse> =
      (input, done) => this.personalizationAffinityValidationClient.previewAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationAffinityValidationServiceApi.PreviewAffinityRequest, personalizationAffinityValidationServiceApi.PreviewAffinityResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse.fromPartial({
        profile: {
          relationshipManager: { email: (reply1?.profile?.relationshipManager?.email ?? "") },
        },
      }),
      personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse.fromPartial({
        outcome: {
          effectiveAt: reply2?.outcome?.effectiveAt,
          status: (reply2?.outcome?.status ?? ""),
        },
      }),
      personalizationProfileWorkflowServiceApi.AdvanceProfileWorkflowResponse.fromPartial({
        profile: {
          primaryAddress: req?.profile?.primaryAddress,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a profile.
   */
  async cancelProfileWorkflow(req: personalizationProfileWorkflowServiceApi.CancelProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CancelProfileWorkflow", req);
    this.logger.info("cancel_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = ledgerLedgerAccountQueryServiceApi.ResolveLedgerAccountsRequest.fromPartial({ context: input1?.context });
    const invoke1: Unary<ledgerLedgerAccountQueryServiceApi.ResolveLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.ResolveLedgerAccountsResponse> =
      (input, done) => this.ledgerLedgerAccountQueryClient.resolveLedgerAccounts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountQueryServiceApi.ResolveLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.ResolveLedgerAccountsResponse>(invoke1, request1);
    const request2 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          email: (req?.details?.notify?.email ?? ""),
          name: req?.profile?.contact?.name,
          phone: (req?.profile?.contact?.phone ?? ""),
        },
      },
    });
    const cloned2: personalizationProfileReportingServiceApi.ShareProfileReportRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.shareProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(invoke2, cloned2);
    const request3 = personalizationAffinitySyncServiceApi.StreamAffinityChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream3 = this.personalizationAffinitySyncClient.streamAffinityChanges(metadataFor(request3.context), { deadline: Date.now() + 15_000 });
    const reading3 = collect(stream3);
    const writing3 = (async () => {
      await write(stream3, request3);
      stream3.end();
    })();
    const [messages3] = await Promise.all([reading3, writing3]);
    const reply3 = messages3.at(-1) ?? personalizationAffinitySyncServiceApi.StreamAffinityChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse.fromPartial({
        profile: { contact: { email: (reply2?.profile?.contact?.email ?? "") } },
      }),
      personalizationProfileWorkflowServiceApi.CancelProfileWorkflowResponse.fromPartial({
        profile: {
          contact: { name: req?.profile?.name },
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a profile.
   */
  async inspectProfileWorkflow(req: personalizationProfileWorkflowServiceApi.InspectProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.InspectProfileWorkflowResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectProfileWorkflow", req);
    this.logger.info("inspect_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.context?.actor?.email ?? "") } },
      profileId: (req?.profileId ?? ""),
    });
    const decoded1 = personalizationProfileReportingServiceApi.ShareProfileReportRequest.fromJSON(
      JSON.parse(JSON.stringify(personalizationProfileReportingServiceApi.ShareProfileReportRequest.toJSON(request1))),
    );
    const invoke1: Unary<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse> =
      (input, done) => this.personalizationProfileReportingClient.shareProfileReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileReportingServiceApi.ShareProfileReportRequest, personalizationProfileReportingServiceApi.ShareProfileReportResponse>(invoke1, decoded1);
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.InspectProfileWorkflowResponse.fromPartial({
        profile: { relationshipManager: reply1?.profile?.relationshipManager },
      }),
      personalizationProfileWorkflowServiceApi.InspectProfileWorkflowResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Pauses a profile.
   */
  async pauseProfileWorkflow(req: personalizationProfileWorkflowServiceApi.PauseProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "PauseProfileWorkflow", req);
    this.logger.info("pause_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { name: req?.profile?.contact?.name } },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.ShareAffinityReportRequest",
      value: Buffer.from(personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.encode(request1).finish()),
    });
    const unpacked1 = personalizationAffinityReportingServiceApi.ShareAffinityReportRequest.decode(envelope1.value);
    const invoke1: Unary<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse> =
      (input, done) => this.personalizationAffinityReportingClient.shareAffinityReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationAffinityReportingServiceApi.ShareAffinityReportRequest, personalizationAffinityReportingServiceApi.ShareAffinityReportResponse>(invoke1, unpacked1);
    const request2 = personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: { audit: { createdAt: req?.profile?.audit?.createdAt } },
    });
    const client2 = this.clients.get<personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient>("acme.personalization.v1.RecommendationSyncService");
    const invoke2: Unary<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse> =
      (input, done) => client2.syncRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse.fromPartial({
        profile: {
          contact: { email: (reply2?.recommendation?.counterparty?.email ?? "") },
        },
      }),
      personalizationProfileWorkflowServiceApi.PauseProfileWorkflowResponse.fromPartial({
        profile: {
          attributes: (req?.profile?.attributes ?? {}),
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a profile.
   */
  async resumeProfileWorkflow(req: personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ResumeProfileWorkflow", req);
    this.logger.info("resume_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest.fromPartial({
      context: req?.context,
      details: {
        recipient: {
          name: req?.profile?.contact?.name,
          preferredChannel: (req?.profile?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse> =
      (input, done) => this.notificationsSubscriptionNotificationClient.notifySubscriptionWatchers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersRequest, notificationsSubscriptionNotificationServiceApi.NotifySubscriptionWatchersResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((reply1?.subscription?.action?.$case === "block" ? reply1?.subscription?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.generateRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>(invoke2, request2));
    const request3 = personalizationAffinityImportServiceApi.RetryAffinityImportRequest.fromPartial({
      affinity: {
        subject: { displayName: (req?.profile?.relationshipManager?.displayName ?? "") },
      },
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
    });
    const invoke3: Unary<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse> =
      (input, done) => this.personalizationAffinityImportClient.retryAffinityImport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await workflow("ResumeProfileWorkflow.RetryAffinityImport", () => call<personalizationAffinityImportServiceApi.RetryAffinityImportRequest, personalizationAffinityImportServiceApi.RetryAffinityImportResponse>(invoke3, request3));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse.fromPartial({
        profile: {
          relationshipManager: { email: (reply1?.subscription?.owner?.email ?? "") },
        },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          status: (reply3?.outcome?.status ?? ""),
        },
      }),
      personalizationProfileWorkflowServiceApi.ResumeProfileWorkflowResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          status: req?.profile?.status,
        },
      }),
    );
  }

  /**
   * Retrys a profile.
   */
  async retryProfileWorkflow(req: personalizationProfileWorkflowServiceApi.RetryProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "RetryProfileWorkflow", req);
    this.logger.info("retry_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumApprovalServiceApi.CommentForumApprovalRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: { createdAt: req?.profile?.audit?.createdAt },
            location: { locality: (req?.profile?.primaryAddress?.locality ?? "") },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumApprovalServiceApi.CommentForumApprovalRequest, communityForumApprovalServiceApi.CommentForumApprovalResponse> =
      (input, done) => this.communityForumApprovalClient.commentForumApproval(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse.fromPartial({
        profile: { contact: { email: (reply1?.forum?.manager?.email ?? "") } },
      }),
      personalizationProfileWorkflowServiceApi.RetryProfileWorkflowResponse.fromPartial({
        profile: {
          attributes: (req?.profile?.attributes ?? {}),
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a profile.
   */
  async signalProfileWorkflow(req: personalizationProfileWorkflowServiceApi.SignalProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "SignalProfileWorkflow", req);
    this.logger.info("signal_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.profile?.primaryAddress?.region ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsRequest, notificationsNotificationNotificationServiceApi.ListNotificationSubscriptionsResponse>(
      "acme.personalization.v1.ProfileWorkflowService/SignalProfileWorkflow:0", request1,
    );
    const request2 = personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.profile?.contact?.email ?? ""),
          preferredChannel: (req?.details?.notify?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.checkRecommendationEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse>(invoke2, request2));
    const request3 = personalizationProfileReportingServiceApi.ListProfileReportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.profile?.primaryAddress?.region ?? "") },
    });
    const invoke3: Unary<personalizationProfileReportingServiceApi.ListProfileReportsRequest, personalizationProfileReportingServiceApi.ListProfileReportsResponse> =
      (input, done) => this.personalizationProfileReportingClient.listProfileReports(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<personalizationProfileReportingServiceApi.ListProfileReportsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.profile?.contact?.preferredChannel ?? "") },
      },
    });
    const invoke4: Unary<audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsRequest, audiencesAudienceSyncValidationServiceApi.LintAudienceSyncsResponse> =
      (input, done) => this.audiencesAudienceSyncValidationClient.lintAudienceSyncs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse.fromPartial({
        profile: { audit: { updatedAt: reply2?.recommendation?.audit?.updatedAt } },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse.fromPartial({ outcome: { nextSteps: (reply4?.outcome?.nextSteps ?? []) } }),
      personalizationProfileWorkflowServiceApi.SignalProfileWorkflowResponse.fromPartial({
        profile: {
          name: req?.profile?.name,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Starts a profile.
   */
  async startProfileWorkflow(req: personalizationProfileWorkflowServiceApi.StartProfileWorkflowRequest): Promise<personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "StartProfileWorkflow", req);
    this.logger.info("start_profile_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: {
          locality: (req?.profile?.primaryAddress?.locality ?? ""),
          recipient: (req?.profile?.primaryAddress?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.SyncRecommendationsRequest, personalizationRecommendationSyncServiceApi.SyncRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.syncRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = performanceReviewQueryServiceApi.SummarizeReviewsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: req?.profile?.preferences?.quietHours },
      reason: (req?.reason ?? ""),
    });
    const method2 = "summarizeReviews" as const;
    const invoke2: Unary<performanceReviewQueryServiceApi.SummarizeReviewsRequest, performanceReviewQueryServiceApi.SummarizeReviewsResponse> =
      (input, done) => this.performanceReviewQueryClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<performanceReviewQueryServiceApi.SummarizeReviewsRequest, performanceReviewQueryServiceApi.SummarizeReviewsResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.notify?.preferredChannel ?? "") });
    return mergeResponses(
      personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse.fromPartial({
        profile: {
          primaryAddress: { recipient: (reply1?.recommendation?.billingAddress?.recipient ?? "") },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse.fromPartial({
        outcome: { status: (reply2?.result?.status ?? "") },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      personalizationProfileWorkflowServiceApi.StartProfileWorkflowResponse.fromPartial({
        profile: {
          attributes: (req?.profile?.attributes ?? {}),
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }
}
