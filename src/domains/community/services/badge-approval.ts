/**
 * Routes badges through approval, with escalation and delegation. Remote work stays behind typed client ports.
 */

import * as communityBadgeApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/badge_approval_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityPostQueryServiceApi from "../../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as identityUserQueryServiceApi from "../../../../.cache/proto/acme/identity/v1/user_query_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationQueryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_query_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationProfileValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_validation_service.js";
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
  promised,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { collect, upload, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toBadgeRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate badge operations and persist audit data.
 */
@injectable()
export class BadgeApprovalWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ForumWorkflowService") private readonly communityForumWorkflowClient: communityForumWorkflowServiceApi.ForumWorkflowServiceClient,
    @inject("grpc:acme.community.v1.PostQueryService") private readonly communityPostQueryClient: communityPostQueryServiceApi.PostQueryServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserQueryService") private readonly identityUserQueryClient: identityUserQueryServiceApi.UserQueryServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyQueryService") private readonly localizationTranslationKeyQueryClient: localizationTranslationKeyQueryServiceApi.TranslationKeyQueryServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationQueryService") private readonly notificationsNotificationQueryClient: notificationsNotificationQueryServiceApi.NotificationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileValidationService") private readonly personalizationProfileValidationClient: personalizationProfileValidationServiceApi.ProfileValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Approves a badge.
   */
  async approveBadge(req: communityBadgeApprovalServiceApi.ApproveBadgeRequest): Promise<communityBadgeApprovalServiceApi.ApproveBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "ApproveBadge", req);
    this.logger.info("approve_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              createdBy: (req?.badge?.audit?.createdBy ?? ""),
              updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
            },
          }],
        }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.advanceForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse>(invoke1, request1));
    const request2 = communityForumWorkflowServiceApi.ResumeForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            location: { postalCode: (reply1?.forum?.location?.postalCode ?? "") },
            manager: { displayName: (req?.badge?.owner?.displayName ?? "") },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumWorkflowServiceApi.ResumeForumWorkflowRequest, communityForumWorkflowServiceApi.ResumeForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.resumeForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<communityForumWorkflowServiceApi.ResumeForumWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.ApproveBadgeResponse.fromPartial({
        badge: { audit: { updatedAt: reply1?.forum?.audit?.updatedAt } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      communityBadgeApprovalServiceApi.ApproveBadgeResponse.fromPartial({
        badge: { owner: { userId: (reply2?.forum?.manager?.userId ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      communityBadgeApprovalServiceApi.ApproveBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          status: req?.badge?.status,
        },
      }),
    );
  }

  /**
   * Comments a badge.
   */
  async commentBadgeApproval(req: communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest): Promise<communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "CommentBadgeApproval", req);
    this.logger.info("comment_badge_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.UpdateProfileRequest.fromPartial({
      context: req?.context,
      profile: { contact: { email: (req?.badge?.owner?.email ?? "") } },
    });
    const invoke1: Unary<personalizationProfileServiceApi.UpdateProfileRequest, personalizationProfileServiceApi.UpdateProfileResponse> =
      (input, done) => this.personalizationProfileClient.updateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = identityUserQueryServiceApi.ExportUsersRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: (reply1?.profile?.identityDocument?.$case === "passport" ? reply1?.profile?.identityDocument.passport : undefined)?.expiresAt,
        region: (reply1?.profile?.primaryAddress?.region ?? ""),
      },
    });
    const stream2 = this.identityUserQueryClient.exportUsers(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? identityUserQueryServiceApi.ExportUsersResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Delegates a badge.
   */
  async delegateBadgeApproval(req: communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest): Promise<communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "DelegateBadgeApproval", req);
    this.logger.info("delegate_badge_approval", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileValidationServiceApi.NormalizeProfileRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.approver?.email ?? "") } },
      profile: {
        audit: {
          createdAt: req?.badge?.audit?.createdAt,
          updatedBy: (req?.badge?.audit?.updatedBy ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationProfileValidationServiceApi.NormalizeProfileRequest, personalizationProfileValidationServiceApi.NormalizeProfileResponse> =
      (input, done) => this.personalizationProfileValidationClient.normalizeProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse.fromPartial({ outcome: { nextSteps: (reply1?.outcome?.nextSteps ?? []) } }),
      communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          owner: req?.badge?.owner,
        },
      }),
    );
  }

  /**
   * Escalates a badge.
   */
  async escalateBadge(req: communityBadgeApprovalServiceApi.EscalateBadgeRequest): Promise<communityBadgeApprovalServiceApi.EscalateBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "EscalateBadge", req);
    this.logger.info("escalate_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentTaxonomyCalculationServiceApi.CalculateTaxonomyRequest.fromPartial({
      context: req?.context,
      taxonomy: {
        children: [{
          audit: {
            createdAt: req?.badge?.audit?.createdAt,
            createdBy: (req?.badge?.audit?.createdBy ?? ""),
          },
          children: [{
            manager: {
              displayName: (req?.details?.approver?.displayName ?? ""),
              email: (req?.badge?.owner?.email ?? ""),
            },
          }],
        }],
      },
    });
    const method1 = "calculateTaxonomy" as const;
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.CalculateTaxonomyRequest, contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse> =
      (input, done) => this.contentTaxonomyCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentTaxonomyCalculationServiceApi.CalculateTaxonomyRequest, contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse>(invoke1, request1);
    const request2 = localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      reason: ((req?.badge?.action?.$case === "block" ? req?.badge?.action.block : undefined)?.reason ?? ""),
    });
    const proxy2 = forwarding(this.localizationTranslationKeyQueryClient);
    const invoke2: Unary<localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse> =
      (input, done) => proxy2.summarizeTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysRequest, localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse>(invoke2, request2);
    const request3 = customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest.fromPartial({
      consentRecord: {
        subject: { displayName: (reply1?.taxonomy?.manager?.displayName ?? "") },
      },
      context: req?.context,
      details: {
        destination: { locality: (reply1?.taxonomy?.location?.locality ?? "") },
      },
    });
    const invoke3: Unary<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.scoreConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersConsentRecordValidationServiceApi.ScoreConsentRecordRequest, customersConsentRecordValidationServiceApi.ScoreConsentRecordResponse>(invoke3, request3);
    const request4 = experimentsExposureValidationServiceApi.NormalizeExposureRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.badge?.owner?.email ?? "") } },
      exposure: {
        correlationId: (reply3?.consentRecord?.correlationId ?? ""),
        sequence: (reply3?.consentRecord?.sequence ?? 0),
        subject: { displayName: (req?.details?.approver?.displayName ?? "") },
      },
    });
    const { context: scope4, ...payload4 } = request4;
    const spread4 = { ...payload4, context: scope4 ?
      { ...scope4, baggage: { ...scope4.baggage } } : undefined };
    const invoke4: Unary<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.normalizeExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<experimentsExposureValidationServiceApi.NormalizeExposureRequest, experimentsExposureValidationServiceApi.NormalizeExposureResponse>(invoke4, spread4);
    const request5 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.badge?.audit?.createdAt,
        source: (req?.badge?.badgeId ?? ""),
        subject: { displayName: (req?.badge?.owner?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream5 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request5.context), { deadline: Date.now() + 15_000 });
    const reading5 = collect(stream5);
    const writing5 = (async () => {
      await write(stream5, request5);
      stream5.end();
    })();
    const [messages5] = await Promise.all([reading5, writing5]);
    const reply5 = messages5.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.EscalateBadgeResponse.fromPartial({
        badge: {
          owner: { displayName: (reply1?.taxonomy?.manager?.displayName ?? "") },
        },
      }),
      communityBadgeApprovalServiceApi.EscalateBadgeResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      communityBadgeApprovalServiceApi.EscalateBadgeResponse.fromPartial({
        result: { correlationId: (reply3?.consentRecord?.correlationId ?? "") },
      }),
      communityBadgeApprovalServiceApi.EscalateBadgeResponse.fromPartial({ outcome: { message: (reply4?.result?.message ?? "") } }),
      communityBadgeApprovalServiceApi.EscalateBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          status: req?.badge?.status,
        },
      }),
    );
  }

  /**
   * Returns a badge.
   */
  async getBadgeApprovalStatus(req: communityBadgeApprovalServiceApi.GetBadgeApprovalStatusRequest): Promise<communityBadgeApprovalServiceApi.GetBadgeApprovalStatusResponse> {
    validateContext(req.context);
    if (!req.badgeId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "badge_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetBadgeApprovalStatus", req);
    this.logger.info("get_badge_approval_status", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = communityForumWorkflowServiceApi.CancelForumWorkflowRequest.fromPartial({
      context: input1?.context,
      forum: {
        children: [{ manager: { userId: (input1?.context?.actor?.userId ?? "") } }],
      },
    });
    const invoke1: Unary<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.cancelForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse>(invoke1, request1);
    return mergeResponses(
      communityBadgeApprovalServiceApi.GetBadgeApprovalStatusResponse.fromPartial({
        badge: { audit: { updatedBy: (reply1?.forum?.audit?.updatedBy ?? "") } },
        result: { message: (reply1?.outcome?.message ?? "") },
      }),
      communityBadgeApprovalServiceApi.GetBadgeApprovalStatusResponse.fromPartial({ badge: { badgeId: (req?.badgeId ?? "") } }),
    );
  }

  /**
   * Lists badges a page at a time.
   */
  async listPendingBadges(req: communityBadgeApprovalServiceApi.ListPendingBadgesRequest): Promise<communityBadgeApprovalServiceApi.ListPendingBadgesResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListPendingBadges", req);
    this.logger.info("list_pending_badges", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.NormalizeExperimentRequest.fromPartial({
      context: req?.context,
      experiment: { location: { region: (req?.filter?.region ?? "") } },
    });
    const cloned1: experimentsExperimentValidationServiceApi.NormalizeExperimentRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse> =
      (input, done) => this.experimentsExperimentValidationClient.normalizeExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentValidationServiceApi.NormalizeExperimentRequest, experimentsExperimentValidationServiceApi.NormalizeExperimentResponse>(invoke1, cloned1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return communityBadgeApprovalServiceApi.ListPendingBadgesResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } });
  }

  /**
   * Recalls a badge.
   */
  async recallBadge(req: communityBadgeApprovalServiceApi.RecallBadgeRequest): Promise<communityBadgeApprovalServiceApi.RecallBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "RecallBadge", req);
    this.logger.info("recall_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumWorkflowServiceApi.SignalForumWorkflowRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (req?.details?.approver?.email ?? "") } }],
        }],
      },
    });
    const decoded1 = communityForumWorkflowServiceApi.SignalForumWorkflowRequest.fromJSON(
      JSON.parse(JSON.stringify(communityForumWorkflowServiceApi.SignalForumWorkflowRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse> =
      (input, done) => this.communityForumWorkflowClient.signalForumWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse>(invoke1, decoded1);
    const request2 = customersHouseholdValidationServiceApi.ValidateHouseholdRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{
            audit: { updatedAt: req?.badge?.audit?.updatedAt },
            location: { recipient: (reply1?.forum?.location?.recipient ?? "") },
            manager: {
              displayName: (reply1?.forum?.manager?.displayName ?? ""),
              userId: (req?.details?.approver?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.customers.v1.ValidateHouseholdRequest",
      value: Buffer.from(customersHouseholdValidationServiceApi.ValidateHouseholdRequest.encode(request2).finish()),
    });
    const unpacked2 = customersHouseholdValidationServiceApi.ValidateHouseholdRequest.decode(envelope2.value);
    const invoke2: Unary<customersHouseholdValidationServiceApi.ValidateHouseholdRequest, customersHouseholdValidationServiceApi.ValidateHouseholdResponse> =
      (input, done) => this.customersHouseholdValidationClient.validateHousehold(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersHouseholdValidationServiceApi.ValidateHouseholdRequest, customersHouseholdValidationServiceApi.ValidateHouseholdResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.RecallBadgeResponse.fromPartial({
        outcome: {
          message: (reply1?.outcome?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityBadgeApprovalServiceApi.RecallBadgeResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeApprovalServiceApi.RecallBadgeResponse.fromPartial({
        badge: { badgeId: (req?.badgeId ?? "") },
        outcome: { effectiveAt: req?.details?.effectiveAt },
      }),
    );
  }

  /**
   * Rejects a badge.
   */
  async rejectBadge(req: communityBadgeApprovalServiceApi.RejectBadgeRequest): Promise<communityBadgeApprovalServiceApi.RejectBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "RejectBadge", req);
    this.logger.info("reject_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostQueryServiceApi.ResolvePostsRequest.fromPartial({ context: req?.context });
    const client1 = this.clients.get<communityPostQueryServiceApi.PostQueryServiceClient>("acme.community.v1.PostQueryService");
    const invoke1: Unary<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse> =
      (input, done) => client1.resolvePosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostQueryServiceApi.ResolvePostsRequest, communityPostQueryServiceApi.ResolvePostsResponse>(invoke1, request1);
    const request2 = communityPostQueryServiceApi.CountPostsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.createdAt,
        ownerId: (req?.details?.approver?.userId ?? ""),
      },
    });
    const invoke2: Unary<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse> =
      (input, done) => this.communityPostQueryClient.countPosts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    const request3 = communityForumServiceApi.BatchCreateForumsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "header", header: {
        source: (req?.badge?.badgeId ?? ""),
        submittedBy: { email: (req?.badge?.owner?.email ?? "") },
      } },
    });
    const reply3 = await upload<communityForumServiceApi.BatchCreateForumsRequest, communityForumServiceApi.BatchCreateForumsResponse>(
      (done) => this.communityForumClient.batchCreateForums(metadataFor(request3.context), { deadline: Date.now() + 15_000 }, done), [request3],
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.RejectBadgeResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      communityBadgeApprovalServiceApi.RejectBadgeResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      communityBadgeApprovalServiceApi.RejectBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          priority: (req?.badge?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Submits a badge.
   */
  async submitBadge(req: communityBadgeApprovalServiceApi.SubmitBadgeRequest): Promise<communityBadgeApprovalServiceApi.SubmitBadgeResponse> {
    validateContext(req.context);
    if (req.badge) {
      await this.repository.save(toBadgeRecord(req.context.tenantId, req.badge));
    }
    await this.repository.record(req.context.tenantId, "SubmitBadge", req);
    this.logger.info("submit_badge", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationQueryServiceApi.BrowseNotificationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.badge?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.badge?.parameters ?? {}))),
        ownerId: (req?.badge?.owner?.userId ?? ""),
      },
    });
    const invoke1: Unary<notificationsNotificationQueryServiceApi.BrowseNotificationsRequest, notificationsNotificationQueryServiceApi.BrowseNotificationsResponse> =
      (input, done) => this.notificationsNotificationQueryClient.browseNotifications(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsNotificationQueryServiceApi.BrowseNotificationsRequest, notificationsNotificationQueryServiceApi.BrowseNotificationsResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityBadgeApprovalServiceApi.SubmitBadgeResponse.fromPartial({
        outcome: { message: (reply1?.result?.message ?? "") },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      communityBadgeApprovalServiceApi.SubmitBadgeResponse.fromPartial({
        badge: {
          badgeId: (req?.badgeId ?? ""),
          owner: req?.badge?.owner,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for BadgeApprovalService; workflows own validation and database transactions.
 */
@injectable()
export class BadgeApprovalHandler {
  constructor(@inject(BadgeApprovalWorkflow) private readonly workflow: BadgeApprovalWorkflow) {}

  /**
   * Approves a badge.
   */
  approveBadge = unary<communityBadgeApprovalServiceApi.ApproveBadgeRequest, communityBadgeApprovalServiceApi.ApproveBadgeResponse>(
    (request) => this.workflow.approveBadge(request),
  );

  /**
   * Comments a badge.
   */
  commentBadgeApproval = unary<communityBadgeApprovalServiceApi.CommentBadgeApprovalRequest, communityBadgeApprovalServiceApi.CommentBadgeApprovalResponse>(
    (request) => this.workflow.commentBadgeApproval(request),
  );

  /**
   * Delegates a badge.
   */
  delegateBadgeApproval = (call: ServerUnaryCall<communityBadgeApprovalServiceApi.DelegateBadgeApprovalRequest, communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse>, done: sendUnaryData<communityBadgeApprovalServiceApi.DelegateBadgeApprovalResponse>): void => {
    void this.workflow.delegateBadgeApproval(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Escalates a badge.
   */
  escalateBadge = unary<communityBadgeApprovalServiceApi.EscalateBadgeRequest, communityBadgeApprovalServiceApi.EscalateBadgeResponse>(
    (request) => this.workflow.escalateBadge(request),
  );

  /**
   * Returns a badge.
   */
  getBadgeApprovalStatus = unary<communityBadgeApprovalServiceApi.GetBadgeApprovalStatusRequest, communityBadgeApprovalServiceApi.GetBadgeApprovalStatusResponse>(
    (request) => this.workflow.getBadgeApprovalStatus(request),
  );

  /**
   * Lists badges a page at a time.
   */
  listPendingBadges = (call: ServerUnaryCall<communityBadgeApprovalServiceApi.ListPendingBadgesRequest, communityBadgeApprovalServiceApi.ListPendingBadgesResponse>, done: sendUnaryData<communityBadgeApprovalServiceApi.ListPendingBadgesResponse>): void => {
    void this.workflow.listPendingBadges(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalls a badge.
   */
  recallBadge = unary<communityBadgeApprovalServiceApi.RecallBadgeRequest, communityBadgeApprovalServiceApi.RecallBadgeResponse>(
    (request) => this.workflow.recallBadge(request),
  );

  /**
   * Rejects a badge.
   */
  rejectBadge = unary<communityBadgeApprovalServiceApi.RejectBadgeRequest, communityBadgeApprovalServiceApi.RejectBadgeResponse>(
    (request) => this.workflow.rejectBadge(request),
  );

  /**
   * Submits a badge.
   */
  submitBadge = (call: ServerUnaryCall<communityBadgeApprovalServiceApi.SubmitBadgeRequest, communityBadgeApprovalServiceApi.SubmitBadgeResponse>, done: sendUnaryData<communityBadgeApprovalServiceApi.SubmitBadgeResponse>): void => {
    void this.workflow.submitBadge(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: BadgeApprovalHandler): communityBadgeApprovalServiceApi.BadgeApprovalServiceServer {
  return {
    approveBadge: handler.approveBadge,
    commentBadgeApproval: handler.commentBadgeApproval,
    delegateBadgeApproval: handler.delegateBadgeApproval,
    escalateBadge: handler.escalateBadge,
    getBadgeApprovalStatus: handler.getBadgeApprovalStatus,
    listPendingBadges: handler.listPendingBadges,
    recallBadge: handler.recallBadge,
    rejectBadge: handler.rejectBadge,
    submitBadge: handler.submitBadge,
  };
}
