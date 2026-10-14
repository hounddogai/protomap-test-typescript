/**
 * Routes profiles through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as communityPostWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as notificationsDeliveryAttemptExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_export_service.js";
import * as notificationsNotificationTemplateValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_validation_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationAffinityCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_calculation_service.js";
import * as personalizationAffinityImportServiceApi from "../../../../.cache/proto/acme/personalization/v1/affinity_import_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
import * as personalizationRecommendationReportingServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_reporting_service.js";
import * as personalizationRecommendationSyncServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_sync_service.js";
import * as procurementPurchaseRequisitionQueryServiceApi from "../../../../.cache/proto/acme/procurement/v1/purchase_requisition_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  forwarding,
  metadataFor,
  operation,
  promised,
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toProfileRecord } from "../data/records.js";
import { PersonalizationRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate profile operations and persist audit data.
 */
@injectable()
export class ProfileApprovalWorkflow {
  constructor(
    @inject(PersonalizationRepository) private readonly repository: PersonalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.community.v1.PostWorkflowService") private readonly communityPostWorkflowClient: communityPostWorkflowServiceApi.PostWorkflowServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptExportService") private readonly notificationsDeliveryAttemptExportClient: notificationsDeliveryAttemptExportServiceApi.DeliveryAttemptExportServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateValidationService") private readonly notificationsNotificationTemplateValidationClient: notificationsNotificationTemplateValidationServiceApi.NotificationTemplateValidationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityCalculationService") private readonly personalizationAffinityCalculationClient: personalizationAffinityCalculationServiceApi.AffinityCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.AffinityImportService") private readonly personalizationAffinityImportClient: personalizationAffinityImportServiceApi.AffinityImportServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationReportingService") private readonly personalizationRecommendationReportingClient: personalizationRecommendationReportingServiceApi.RecommendationReportingServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationSyncService") private readonly personalizationRecommendationSyncClient: personalizationRecommendationSyncServiceApi.RecommendationSyncServiceClient,
    @inject("grpc:acme.procurement.v1.PurchaseRequisitionQueryService") private readonly procurementPurchaseRequisitionQueryClient: procurementPurchaseRequisitionQueryServiceApi.PurchaseRequisitionQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a profile.
   */
  async approveProfile(req: personalizationProfileApprovalServiceApi.ApproveProfileRequest): Promise<personalizationProfileApprovalServiceApi.ApproveProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "ApproveProfile", req);
    this.logger.info("approve_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.PushRecommendationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { countryCode: (req?.profile?.primaryAddress?.countryCode ?? "") },
        counterparty: { email: (req?.details?.approver?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.profile?.attributes ?? {}))),
        }],
      },
    });
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pushRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<personalizationRecommendationSyncServiceApi.PushRecommendationRequest, personalizationRecommendationSyncServiceApi.PushRecommendationResponse>(invoke1, request1));
    const request2 = personalizationAffinityCalculationServiceApi.CalculateAffinityRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.profile?.primaryAddress?.postalCode ?? ""),
          recipient: (req?.profile?.primaryAddress?.recipient ?? ""),
          region: (reply1?.recommendation?.billingAddress?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse> =
      (input, done) => this.personalizationAffinityCalculationClient.calculateAffinity(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ApproveProfile.CalculateAffinity", () => call<personalizationAffinityCalculationServiceApi.CalculateAffinityRequest, personalizationAffinityCalculationServiceApi.CalculateAffinityResponse>(invoke2, request2));
    const request3 = personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      recommendationId: (reply2?.affinity?.subject?.recommendationId ?? ""),
    });
    const invoke3: Unary<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.scheduleRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = personalizationAffinityImportServiceApi.ListAffinityImportsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.profile?.primaryAddress?.region ?? "") },
    });
    const reply4 = await this.workQueue.enqueue<personalizationAffinityImportServiceApi.ListAffinityImportsRequest, personalizationAffinityImportServiceApi.ListAffinityImportsResponse>(
      "acme.personalization.v1.ProfileApprovalService/ApproveProfile:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.ApproveProfileResponse.fromPartial({
        profile: {
          primaryAddress: { lines: (reply1?.recommendation?.billingAddress?.lines ?? []) },
        },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      personalizationProfileApprovalServiceApi.ApproveProfileResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      personalizationProfileApprovalServiceApi.ApproveProfileResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      personalizationProfileApprovalServiceApi.ApproveProfileResponse.fromPartial({
        outcome: { message: (reply4?.result?.message ?? "") },
        result: { status: (reply4?.result?.status ?? "") },
      }),
      personalizationProfileApprovalServiceApi.ApproveProfileResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          status: req?.profile?.status,
        },
      }),
    );
  }

  /**
   * Comments a profile.
   */
  async commentProfileApproval(req: personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest): Promise<personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "CommentProfileApproval", req);
    this.logger.info("comment_profile_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.profile?.audit?.createdAt,
        region: (req?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.countRecommendationTotals(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<personalizationRecommendationReportingServiceApi.CountRecommendationTotalsRequest, personalizationRecommendationReportingServiceApi.CountRecommendationTotalsResponse>(invoke1, request1));
    const request2 = notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: { region: (req?.profile?.primaryAddress?.region ?? "") },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateRequest, notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateValidationClient.validateNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsNotificationTemplateValidationServiceApi.ValidateNotificationTemplateResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = personalizationProfileValidationServiceApi.ValidateProfileRequest.fromPartial({
      context: req?.context,
      profile: {
        audit: {
          createdAt: reply2?.notificationTemplate?.audit?.createdAt,
          updatedAt: reply2?.notificationTemplate?.audit?.updatedAt,
        },
        primaryAddress: {
          locality: (reply2?.notificationTemplate?.billingAddress?.locality ?? ""),
        },
      },
    });
    const invoke3: Unary<personalizationProfileValidationServiceApi.ValidateProfileRequest, personalizationProfileValidationServiceApi.ValidateProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.validateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse.fromPartial({
        profile: {
          audit: { createdBy: (reply2?.notificationTemplate?.audit?.createdBy ?? "") },
          primaryAddress: {
            recipient: (reply2?.notificationTemplate?.billingAddress?.recipient ?? ""),
          },
        },
      }),
      personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse.fromPartial({
        profile: { contact: { phone: (reply3?.profile?.contact?.phone ?? "") } },
      }),
      personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse.fromPartial({
        profile: {
          name: req?.profile?.name,
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Delegates a profile.
   */
  async delegateProfileApproval(req: personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest): Promise<personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "DelegateProfileApproval", req);
    this.logger.info("delegate_profile_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: { audit: { createdAt: req?.profile?.audit?.createdAt } },
    });
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.PreviewLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.previewLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest.fromPartial({
      context: req?.context,
      recommendation: {
        audit: {
          createdAt: reply1?.ledgerAccount?.audit?.createdAt,
          updatedAt: req?.profile?.audit?.updatedAt,
        },
        counterparty: {
          displayName: (reply1?.ledgerAccount?.holder?.displayName ?? ""),
          email: (reply1?.ledgerAccount?.contact?.email ?? ""),
        },
      },
    });
    const method2 = "resolveRecommendationConflict" as const;
    const invoke2: Unary<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest, personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse> =
      (input, done) => this.personalizationRecommendationSyncClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictRequest, personalizationRecommendationSyncServiceApi.ResolveRecommendationConflictResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse.fromPartial({
        profile: {
          audit: { createdAt: reply1?.ledgerAccount?.audit?.createdAt },
          contact: reply1?.ledgerAccount?.contact,
        },
      }),
      personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse.fromPartial({ result: { status: (reply2?.outcome?.status ?? "") } }),
      personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          status: req?.profile?.status,
        },
      }),
    );
  }

  /**
   * Escalates a profile.
   */
  async escalateProfile(req: personalizationProfileApprovalServiceApi.EscalateProfileRequest): Promise<personalizationProfileApprovalServiceApi.EscalateProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "EscalateProfile", req);
    this.logger.info("escalate_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const proxy1 = forwarding(this.personalizationRecommendationReportingClient);
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse> =
      (input, done) => proxy1.generateRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationReportingServiceApi.GenerateRecommendationReportRequest, personalizationRecommendationReportingServiceApi.GenerateRecommendationReportResponse>(invoke1, request1);
    const request2 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      profile: {
        primaryAddress: { countryCode: (req?.profile?.primaryAddress?.countryCode ?? "") },
      },
    });
    const invoke2: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke2, request2);
    const request3 = notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          phone: (reply2?.profile?.contact?.phone ?? ""),
          preferredChannel: (reply2?.profile?.contact?.preferredChannel ?? ""),
        },
      },
      subscription: {
        owner: {
          displayName: (reply2?.profile?.relationshipManager?.displayName ?? ""),
          email: (req?.profile?.contact?.email ?? ""),
        },
      },
    });
    const { context: scope3, ...payload3 } = request3;
    const spread3 = { ...payload3, context: scope3 ?
      { ...scope3, baggage: { ...scope3.baggage } } : undefined };
    const invoke3: Unary<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.explainSubscriptionCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationRequest, notificationsSubscriptionCalculationServiceApi.ExplainSubscriptionCalculationResponse>(invoke3, spread3);
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.EscalateProfileResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      personalizationProfileApprovalServiceApi.EscalateProfileResponse.fromPartial({
        profile: {
          primaryAddress: { lines: (reply2?.profile?.primaryAddress?.lines ?? []) },
        },
      }),
      personalizationProfileApprovalServiceApi.EscalateProfileResponse.fromPartial({ result: { correlationId: (reply3?.result?.correlationId ?? "") } }),
      personalizationProfileApprovalServiceApi.EscalateProfileResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: req?.profile?.relationshipManager,
        },
      }),
    );
  }

  /**
   * Returns a profile.
   */
  async getProfileApprovalStatus(req: personalizationProfileApprovalServiceApi.GetProfileApprovalStatusRequest): Promise<personalizationProfileApprovalServiceApi.GetProfileApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.profileId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "profile_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetProfileApprovalStatus", req);
    this.logger.info("get_profile_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest.fromPartial({
      context: input1?.context,
      filter: {
        createdAfter: input1?.context?.deadline,
        ownerId: (input1?.profileId ?? ""),
      },
    });
    const invoke1: Unary<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.countAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.CountAccessPoliciesResponse>(invoke1, request1);
    return mergeResponses(
      personalizationProfileApprovalServiceApi.GetProfileApprovalStatusResponse.fromPartial({ result: { referenceIds: (reply1?.result?.referenceIds ?? []) } }),
      personalizationProfileApprovalServiceApi.GetProfileApprovalStatusResponse.fromPartial({ profile: { profileId: (req?.profileId ?? "") } }),
    );
  }

  /**
   * Lists profiles a page at a time.
   */
  async listPendingProfiles(req: personalizationProfileApprovalServiceApi.ListPendingProfilesRequest): Promise<personalizationProfileApprovalServiceApi.ListPendingProfilesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingProfiles", req);
    this.logger.info("list_pending_profiles", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest.fromPartial({
      context: req?.context,
      profile: { primaryAddress: { region: (req?.filter?.region ?? "") } },
    });
    const cloned1: personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse> =
      (input, done) => this.personalizationProfileCalculationClient.explainProfileCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.ExplainProfileCalculationRequest, personalizationProfileCalculationServiceApi.ExplainProfileCalculationResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return personalizationProfileApprovalServiceApi.ListPendingProfilesResponse.fromPartial({
      profiles: [{
        primaryAddress: { countryCode: (reply1?.profile?.primaryAddress?.countryCode ?? "") },
      }],
    });
  }

  /**
   * Recalls a profile.
   */
  async recallProfile(req: personalizationProfileApprovalServiceApi.RecallProfileRequest): Promise<personalizationProfileApprovalServiceApi.RecallProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "RecallProfile", req);
    this.logger.info("recall_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: {
        subject: {
          displayName: (req?.profile?.relationshipManager?.displayName ?? ""),
          number: ((req?.profile?.identityDocument?.$case === "nationalId" ? req?.profile?.identityDocument.nationalId : undefined)?.number ?? ""),
        },
      },
      details: { notify: { name: req?.profile?.name } },
    });
    const decoded1 = notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest.fromJSON(
      JSON.parse(JSON.stringify(notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest.toJSON(request1))),
    );
    const invoke1: Unary<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse> =
      (input, done) => this.notificationsDeliveryAttemptExportClient.retryDeliveryAttemptExport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportRequest, notificationsDeliveryAttemptExportServiceApi.RetryDeliveryAttemptExportResponse>(invoke1, decoded1);
    const request2 = communityPostWorkflowServiceApi.RetryPostWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { phone: (req?.profile?.contact?.phone ?? "") } },
      post: {
        audit: { createdAt: req?.profile?.audit?.createdAt },
        billingAddress: { postalCode: (req?.profile?.primaryAddress?.postalCode ?? "") },
        counterparty: { email: (req?.details?.approver?.email ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.RetryPostWorkflowRequest",
      value: Buffer.from(communityPostWorkflowServiceApi.RetryPostWorkflowRequest.encode(request2).finish()),
    });
    const unpacked2 = communityPostWorkflowServiceApi.RetryPostWorkflowRequest.decode(envelope2.value);
    const invoke2: Unary<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse> =
      (input, done) => this.communityPostWorkflowClient.retryPostWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse>(invoke2, unpacked2);
    const request3 = procurementPurchaseRequisitionQueryServiceApi.SummarizePurchaseRequisitionsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: req?.profile?.preferences?.quietHours },
      reason: (req?.reason ?? ""),
    });
    const client3 = this.clients.get<procurementPurchaseRequisitionQueryServiceApi.PurchaseRequisitionQueryServiceClient>("acme.procurement.v1.PurchaseRequisitionQueryService");
    const invoke3: Unary<procurementPurchaseRequisitionQueryServiceApi.SummarizePurchaseRequisitionsRequest, procurementPurchaseRequisitionQueryServiceApi.SummarizePurchaseRequisitionsResponse> =
      (input, done) => client3.summarizePurchaseRequisitions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<procurementPurchaseRequisitionQueryServiceApi.SummarizePurchaseRequisitionsRequest, procurementPurchaseRequisitionQueryServiceApi.SummarizePurchaseRequisitionsResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.details?.approver?.displayName ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.RecallProfileResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.outcome?.status ?? "") },
      }),
      personalizationProfileApprovalServiceApi.RecallProfileResponse.fromPartial({
        profile: {
          primaryAddress: {
            lines: (reply2?.post?.billingAddress?.lines ?? []),
            locality: (reply2?.post?.billingAddress?.locality ?? ""),
          },
        },
      }),
      personalizationProfileApprovalServiceApi.RecallProfileResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      personalizationProfileApprovalServiceApi.RecallProfileResponse.fromPartial({
        profile: {
          attributes: (req?.profile?.attributes ?? {}),
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Rejects a profile.
   */
  async rejectProfile(req: personalizationProfileApprovalServiceApi.RejectProfileRequest): Promise<personalizationProfileApprovalServiceApi.RejectProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "RejectProfile", req);
    this.logger.info("reject_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: { period: req?.profile?.preferences?.quietHours },
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> =
      (input, done) => this.personalizationRecommendationReportingClient.scheduleRecommendationReport(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportRequest, personalizationRecommendationReportingServiceApi.ScheduleRecommendationReportResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { createdAt: req?.profile?.audit?.createdAt },
        contact: {
          email: (req?.profile?.contact?.email ?? ""),
          name: req?.profile?.name,
        },
        holder: {
          number: ((req?.profile?.identityDocument?.$case === "passport" ? req?.profile?.identityDocument.passport : undefined)?.number ?? ""),
        },
      },
    });
    const invoke2: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.details?.approver?.email ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.RejectProfileResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      personalizationProfileApprovalServiceApi.RejectProfileResponse.fromPartial({
        profile: {
          contact: { email: (reply2?.ledgerAccount?.contact?.email ?? "") },
          relationshipManager: { displayName: (reply2?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      personalizationProfileApprovalServiceApi.RejectProfileResponse.fromPartial({
        profile: {
          contact: { name: req?.profile?.name },
          profileId: (req?.profileId ?? ""),
        },
      }),
    );
  }

  /**
   * Submits a profile.
   */
  async submitProfile(req: personalizationProfileApprovalServiceApi.SubmitProfileRequest): Promise<personalizationProfileApprovalServiceApi.SubmitProfileResponse> {
    validateContext(req.context);
    if (req.profile) {
      await this.repository.save(toProfileRecord(req.context.tenantId, req.profile));
    }
    await this.repository.record(req.context.tenantId, "SubmitProfile", req);
    this.logger.info("submit_profile", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationSyncServiceApi.PullRecommendationsRequest.fromPartial({
      context: req?.context,
      recommendation: {
        counterparty: { email: (req?.profile?.relationshipManager?.email ?? "") },
      },
    });
    const invoke1: Unary<personalizationRecommendationSyncServiceApi.PullRecommendationsRequest, personalizationRecommendationSyncServiceApi.PullRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationSyncClient.pullRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("SubmitProfile.PullRecommendations", () => call<personalizationRecommendationSyncServiceApi.PullRecommendationsRequest, personalizationRecommendationSyncServiceApi.PullRecommendationsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      personalizationProfileApprovalServiceApi.SubmitProfileResponse.fromPartial({
        profile: {
          primaryAddress: { locality: (reply1?.recommendation?.billingAddress?.locality ?? "") },
        },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      personalizationProfileApprovalServiceApi.SubmitProfileResponse.fromPartial({
        profile: {
          profileId: (req?.profileId ?? ""),
          relationshipManager: req?.profile?.relationshipManager,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ProfileApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class ProfileApprovalHandler {
  constructor(@inject(ProfileApprovalWorkflow) private readonly workflow: ProfileApprovalWorkflow) {}

  /**
   * Approves a profile.
   */
  approveProfile = unary<personalizationProfileApprovalServiceApi.ApproveProfileRequest, personalizationProfileApprovalServiceApi.ApproveProfileResponse>(
    (request) => this.workflow.approveProfile(request),
  );

  /**
   * Comments a profile.
   */
  commentProfileApproval = unary<personalizationProfileApprovalServiceApi.CommentProfileApprovalRequest, personalizationProfileApprovalServiceApi.CommentProfileApprovalResponse>(
    (request) => this.workflow.commentProfileApproval(request),
  );

  /**
   * Delegates a profile.
   */
  delegateProfileApproval = (call: ServerUnaryCall<personalizationProfileApprovalServiceApi.DelegateProfileApprovalRequest, personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse>, done: sendUnaryData<personalizationProfileApprovalServiceApi.DelegateProfileApprovalResponse>): void => {
    void this.workflow.delegateProfileApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a profile.
   */
  escalateProfile = unary<personalizationProfileApprovalServiceApi.EscalateProfileRequest, personalizationProfileApprovalServiceApi.EscalateProfileResponse>(
    (request) => this.workflow.escalateProfile(request),
  );

  /**
   * Returns a profile.
   */
  getProfileApprovalStatus = unary<personalizationProfileApprovalServiceApi.GetProfileApprovalStatusRequest, personalizationProfileApprovalServiceApi.GetProfileApprovalStatusResponse>(
    (request) => this.workflow.getProfileApprovalStatus(request),
  );

  /**
   * Lists profiles a page at a time.
   */
  listPendingProfiles = (call: ServerUnaryCall<personalizationProfileApprovalServiceApi.ListPendingProfilesRequest, personalizationProfileApprovalServiceApi.ListPendingProfilesResponse>, done: sendUnaryData<personalizationProfileApprovalServiceApi.ListPendingProfilesResponse>): void => {
    void this.workflow.listPendingProfiles(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a profile.
   */
  recallProfile = unary<personalizationProfileApprovalServiceApi.RecallProfileRequest, personalizationProfileApprovalServiceApi.RecallProfileResponse>(
    (request) => this.workflow.recallProfile(request),
  );

  /**
   * Rejects a profile.
   */
  rejectProfile = unary<personalizationProfileApprovalServiceApi.RejectProfileRequest, personalizationProfileApprovalServiceApi.RejectProfileResponse>(
    (request) => this.workflow.rejectProfile(request),
  );

  /**
   * Submits a profile.
   */
  submitProfile = (call: ServerUnaryCall<personalizationProfileApprovalServiceApi.SubmitProfileRequest, personalizationProfileApprovalServiceApi.SubmitProfileResponse>, done: sendUnaryData<personalizationProfileApprovalServiceApi.SubmitProfileResponse>): void => {
    void this.workflow.submitProfile(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ProfileApprovalHandler): personalizationProfileApprovalServiceApi.ProfileApprovalServiceServer {
  return {
    approveProfile: handler.approveProfile,
    commentProfileApproval: handler.commentProfileApproval,
    delegateProfileApproval: handler.delegateProfileApproval,
    escalateProfile: handler.escalateProfile,
    getProfileApprovalStatus: handler.getProfileApprovalStatus,
    listPendingProfiles: handler.listPendingProfiles,
    recallProfile: handler.recallProfile,
    rejectProfile: handler.rejectProfile,
    submitProfile: handler.submitProfile,
  };
}
