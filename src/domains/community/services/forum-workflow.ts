/**
 * Runs the long-lived workflow that takes a forum from start to finish. Remote work stays behind typed client ports.
 */

import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityForumWorkflowServiceApi from "../../../../.cache/proto/acme/community/v1/forum_workflow_service.js";
import * as communityModerationValidationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_validation_service.js";
import * as communityPostApprovalServiceApi from "../../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as concessionsConcessionStandCalculationServiceApi from "../../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as contentContentRevisionCalculationServiceApi from "../../../../.cache/proto/acme/content/v1/content_revision_calculation_service.js";
import * as customersConsentRecordValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/consent_record_validation_service.js";
import * as customersCustomerCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_calculation_service.js";
import * as customersCustomerSegmentCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/customer_segment_calculation_service.js";
import * as customersHouseholdValidationServiceApi from "../../../../.cache/proto/acme/customers/v1/household_validation_service.js";
import * as customersPreferenceCalculationServiceApi from "../../../../.cache/proto/acme/customers/v1/preference_calculation_service.js";
import * as metricsMetricSeriesServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsNotificationTemplateSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_sync_service.js";
import * as warehousingWarehouseQueryServiceApi from "../../../../.cache/proto/acme/warehousing/v1/warehouse_query_service.js";
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
import { collect, write } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toForumRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate forum operations and persist audit data.
 */
@injectable()
export class ForumWorkflowWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.ModerationValidationService") private readonly communityModerationValidationClient: communityModerationValidationServiceApi.ModerationValidationServiceClient,
    @inject("grpc:acme.community.v1.PostApprovalService") private readonly communityPostApprovalClient: communityPostApprovalServiceApi.PostApprovalServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.concessions.v1.ConcessionStandCalculationService") private readonly concessionsConcessionStandCalculationClient: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentRevisionCalculationService") private readonly contentContentRevisionCalculationClient: contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient,
    @inject("grpc:acme.customers.v1.ConsentRecordValidationService") private readonly customersConsentRecordValidationClient: customersConsentRecordValidationServiceApi.ConsentRecordValidationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerCalculationService") private readonly customersCustomerCalculationClient: customersCustomerCalculationServiceApi.CustomerCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentCalculationService") private readonly customersCustomerSegmentCalculationClient: customersCustomerSegmentCalculationServiceApi.CustomerSegmentCalculationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdValidationService") private readonly customersHouseholdValidationClient: customersHouseholdValidationServiceApi.HouseholdValidationServiceClient,
    @inject("grpc:acme.customers.v1.PreferenceCalculationService") private readonly customersPreferenceCalculationClient: customersPreferenceCalculationServiceApi.PreferenceCalculationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesService") private readonly metricsMetricSeriesClient: metricsMetricSeriesServiceApi.MetricSeriesServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateSyncService") private readonly notificationsNotificationTemplateSyncClient: notificationsNotificationTemplateSyncServiceApi.NotificationTemplateSyncServiceClient,
    @inject("grpc:acme.warehousing.v1.WarehouseQueryService") private readonly warehousingWarehouseQueryClient: warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a forum.
   */
  async advanceForumWorkflow(req: communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "AdvanceForumWorkflow", req);
    this.logger.info("advance_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = metricsMetricSeriesServiceApi.CloneMetricSeriesRequest.fromPartial({
      context: req?.context,
      metricSeries: { owner: { displayName: (req?.forum?.manager?.displayName ?? "") } },
    });
    const invoke1: Unary<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse> =
      (input, done) => this.metricsMetricSeriesClient.cloneMetricSeries(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("AdvanceForumWorkflow.CloneMetricSeries", () => call<metricsMetricSeriesServiceApi.CloneMetricSeriesRequest, metricsMetricSeriesServiceApi.CloneMetricSeriesResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesRequest.fromPartial({
      frame: { $case: "change", change: {
        occurredAt: req?.context?.deadline,
        source: (req?.context?.actor?.userId ?? ""),
        subject: { displayName: (req?.forum?.manager?.displayName ?? "") },
      } },
      context: req?.context,
    });
    const stream2 = this.notificationsDeliveryAttemptSyncClient.streamDeliveryAttemptChanges(metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const reading2 = collect(stream2);
    const writing2 = (async () => {
      await write(stream2, request2);
      stream2.end();
    })();
    const [messages2] = await Promise.all([reading2, writing2]);
    const reply2 = messages2.at(-1) ?? notificationsDeliveryAttemptSyncServiceApi.StreamDeliveryAttemptChangesResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            audit: { createdAt: reply1?.metricSeries?.audit?.createdAt },
            children: [{ children: [{ name: (reply1?.metricSeries?.name ?? "") }] }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          name: (req?.forum?.name ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a forum.
   */
  async cancelForumWorkflow(req: communityForumWorkflowServiceApi.CancelForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.CancelForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "CancelForumWorkflow", req);
    this.logger.info("cancel_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumValidationServiceApi.GetForumRulesRequest.fromPartial({
      context: req?.context,
      forumId: (req?.forumId ?? ""),
    });
    const invoke1: Unary<communityForumValidationServiceApi.GetForumRulesRequest, communityForumValidationServiceApi.GetForumRulesResponse> =
      (input, done) => this.communityForumValidationClient.getForumRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.CancelForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              audit: { updatedAt: reply1?.forum?.audit?.updatedAt },
              children: [{ status: reply1?.forum?.status }],
            }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.CancelForumWorkflowResponse.fromPartial({
        forum: {
          attributes: (req?.forum?.attributes ?? {}),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a forum.
   */
  async inspectForumWorkflow(req: communityForumWorkflowServiceApi.InspectForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.InspectForumWorkflowResponse> {
    validateContext(req.context);
    if (!req.forumId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "forum_id is required");
    }
    await this.repository.record(req.context.tenantId, "InspectForumWorkflow", req);
    this.logger.info("inspect_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityBadgeCalculationServiceApi.RecalculateBadgesRequest.fromPartial({
      badge: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
      context: req?.context,
    });
    const reply1 = await this.workQueue.enqueue<communityBadgeCalculationServiceApi.RecalculateBadgesRequest, communityBadgeCalculationServiceApi.RecalculateBadgesResponse>(
      "acme.community.v1.ForumWorkflowService/InspectForumWorkflow:0", request1,
    );
    return mergeResponses(
      communityForumWorkflowServiceApi.InspectForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{ manager: { displayName: (reply1?.badge?.owner?.displayName ?? "") } }],
            manager: { userId: (reply1?.badge?.owner?.userId ?? "") },
          }],
        },
      }),
      communityForumWorkflowServiceApi.InspectForumWorkflowResponse.fromPartial({ forum: { forumId: (req?.forumId ?? "") } }),
    );
  }

  /**
   * Pauses a forum.
   */
  async pauseForumWorkflow(req: communityForumWorkflowServiceApi.PauseForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.PauseForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "PauseForumWorkflow", req);
    this.logger.info("pause_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest.fromPartial({
      concessionStand: { audit: { createdAt: req?.forum?.audit?.createdAt } },
      context: req?.context,
    });
    const invoke1: Unary<concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandResponse> =
      (input, done) => this.concessionsConcessionStandCalculationClient.calculateConcessionStand(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandResponse>(invoke1, request1));
    const request2 = customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest.fromPartial({
      context: req?.context,
      details: { destination: { locality: (req?.forum?.location?.locality ?? "") } },
      preference: {
        audit: { updatedAt: req?.forum?.audit?.updatedAt },
        owner: { displayName: (req?.forum?.manager?.displayName ?? "") },
      },
    });
    const invoke2: Unary<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsRequest, customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse> =
      (input, done) => this.customersPreferenceCalculationClient.comparePreferenceOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<customersPreferenceCalculationServiceApi.ComparePreferenceOptionsResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.PauseForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              location: {
                countryCode: ((reply1?.concessionStand?.locator?.$case === "address" ? reply1?.concessionStand?.locator.address : undefined)?.countryCode ?? ""),
              },
              manager: { email: (reply1?.concessionStand?.owner?.email ?? "") },
            }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.PauseForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              audit: { createdBy: (reply2?.preference?.audit?.createdBy ?? "") },
              children: [{ name: (reply2?.preference?.name ?? "") }],
            }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.PauseForumWorkflowResponse.fromPartial({
        forum: {
          attributes: (req?.forum?.attributes ?? {}),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Resumes a forum.
   */
  async resumeForumWorkflow(req: communityForumWorkflowServiceApi.ResumeForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.ResumeForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "ResumeForumWorkflow", req);
    this.logger.info("resume_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityModerationValidationServiceApi.LintModerationsRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { preferredChannel: (req?.details?.notify?.preferredChannel ?? "") },
      },
      moderation: {
        audit: { createdBy: (req?.forum?.audit?.createdBy ?? "") },
        requester: { email: (req?.details?.notify?.email ?? "") },
      },
    });
    const invoke1: Unary<communityModerationValidationServiceApi.LintModerationsRequest, communityModerationValidationServiceApi.LintModerationsResponse> =
      (input, done) => this.communityModerationValidationClient.lintModerations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.forum?.location?.region ?? "") },
    });
    const invoke2: Unary<notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsRequest, notificationsNotificationTemplateSyncServiceApi.ListNotificationTemplateConflictsResponse> =
      (input, done) => this.notificationsNotificationTemplateSyncClient.listNotificationTemplateConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const request3 = communityPostValidationServiceApi.CheckPostEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: ((reply1?.moderation?.origin?.$case === "customer" ? reply1?.moderation?.origin.customer : undefined)?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
      post: { audit: { updatedAt: reply1?.moderation?.audit?.updatedAt } },
    });
    const method3 = "checkPostEligibility" as const;
    const invoke3: Unary<communityPostValidationServiceApi.CheckPostEligibilityRequest, communityPostValidationServiceApi.CheckPostEligibilityResponse> =
      (input, done) => this.communityPostValidationClient[method3](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostValidationServiceApi.CheckPostEligibilityRequest, communityPostValidationServiceApi.CheckPostEligibilityResponse>(invoke3, request3);
    const request4 = customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest.fromPartial({
      context: req?.context,
      household: {
        children: [{
          children: [{ manager: { email: (reply3?.post?.counterparty?.email ?? "") } }],
        }],
      },
    });
    const proxy4 = forwarding(this.customersHouseholdValidationClient);
    const invoke4: Unary<customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest, customersHouseholdValidationServiceApi.ExplainHouseholdDecisionResponse> =
      (input, done) => proxy4.explainHouseholdDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<customersHouseholdValidationServiceApi.ExplainHouseholdDecisionRequest, customersHouseholdValidationServiceApi.ExplainHouseholdDecisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.ResumeForumWorkflowResponse.fromPartial({
        forum: {
          children: [{ audit: { etag: (reply1?.moderation?.audit?.etag ?? "") } }],
        },
        outcome: { effectiveAt: reply1?.outcome?.effectiveAt },
      }),
      communityForumWorkflowServiceApi.ResumeForumWorkflowResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityForumWorkflowServiceApi.ResumeForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              location: { postalCode: (reply3?.post?.billingAddress?.postalCode ?? "") },
            }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.ResumeForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{ audit: { etag: (reply4?.household?.audit?.etag ?? "") } }],
          }],
        },
        outcome: { status: (reply4?.outcome?.status ?? "") },
      }),
      communityForumWorkflowServiceApi.ResumeForumWorkflowResponse.fromPartial({
        forum: {
          depth: (req?.forum?.depth ?? 0),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Retrys a forum.
   */
  async retryForumWorkflow(req: communityForumWorkflowServiceApi.RetryForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.RetryForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "RetryForumWorkflow", req);
    this.logger.info("retry_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = warehousingWarehouseQueryServiceApi.FindWarehousesRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.forum?.location?.region ?? "") },
    });
    const invoke1: Unary<warehousingWarehouseQueryServiceApi.FindWarehousesRequest, warehousingWarehouseQueryServiceApi.FindWarehousesResponse> =
      (input, done) => this.warehousingWarehouseQueryClient.findWarehouses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<warehousingWarehouseQueryServiceApi.FindWarehousesRequest, warehousingWarehouseQueryServiceApi.FindWarehousesResponse>(invoke1, request1);
    const request2 = customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          createdAt: req?.forum?.audit?.createdAt,
          updatedBy: (req?.forum?.audit?.updatedBy ?? ""),
        },
        owner: { displayName: (req?.forum?.manager?.displayName ?? "") },
      },
      details: { contact: { email: (req?.forum?.manager?.email ?? "") } },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse> =
      (input, done) => this.customersCustomerSegmentCalculationClient.explainCustomerSegmentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationRequest, customersCustomerSegmentCalculationServiceApi.ExplainCustomerSegmentCalculationResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = customersCustomerCalculationServiceApi.SimulateCustomerRequest.fromPartial({
      context: input3?.context,
      customer: {
        contact: { phone: (input3?.details?.notify?.phone ?? "") },
        primaryAddress: { region: (input3?.forum?.location?.region ?? "") },
      },
    });
    const invoke3: Unary<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse> =
      (input, done) => this.customersCustomerCalculationClient.simulateCustomer(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<customersCustomerCalculationServiceApi.SimulateCustomerRequest, customersCustomerCalculationServiceApi.SimulateCustomerResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.RetryForumWorkflowResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityForumWorkflowServiceApi.RetryForumWorkflowResponse.fromPartial({
        outcome: { message: (reply2?.result?.message ?? "") },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      communityForumWorkflowServiceApi.RetryForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            children: [{
              location: { region: (reply3?.customer?.primaryAddress?.region ?? "") },
            }],
          }],
          location: { postalCode: (reply3?.customer?.primaryAddress?.postalCode ?? "") },
        },
      }),
      communityForumWorkflowServiceApi.RetryForumWorkflowResponse.fromPartial({
        forum: {
          attributes: (req?.forum?.attributes ?? {}),
          forumId: (req?.forumId ?? ""),
        },
      }),
    );
  }

  /**
   * Signals a forum.
   */
  async signalForumWorkflow(req: communityForumWorkflowServiceApi.SignalForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.SignalForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "SignalForumWorkflow", req);
    this.logger.info("signal_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumServiceApi.UpdateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{ manager: { email: (req?.forum?.manager?.email ?? "") } }],
        }],
      },
    });
    const cloned1: communityForumServiceApi.UpdateForumRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse> =
      (input, done) => this.communityForumClient.updateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumServiceApi.UpdateForumRequest, communityForumServiceApi.UpdateForumResponse>(invoke1, cloned1);
    const request2 = communityPostApprovalServiceApi.RecallPostRequest.fromPartial({
      context: req?.context,
      details: { approver: { email: (reply1?.forum?.manager?.email ?? "") } },
      post: {
        audit: {
          createdAt: req?.forum?.audit?.createdAt,
          updatedAt: reply1?.forum?.audit?.updatedAt,
        },
        billingAddress: { postalCode: (req?.forum?.location?.postalCode ?? "") },
      },
    });
    const decoded2 = communityPostApprovalServiceApi.RecallPostRequest.fromJSON(
      JSON.parse(JSON.stringify(communityPostApprovalServiceApi.RecallPostRequest.toJSON(request2))),
    );
    const invoke2: Unary<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse> =
      (input, done) => this.communityPostApprovalClient.recallPost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostApprovalServiceApi.RecallPostRequest, communityPostApprovalServiceApi.RecallPostResponse>(invoke2, decoded2);
    const request3 = communityPostValidationServiceApi.ValidatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedAt: reply2?.post?.audit?.updatedAt },
        billingAddress: {
          countryCode: (reply2?.post?.billingAddress?.countryCode ?? ""),
          recipient: (reply2?.post?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.ValidatePostRequest",
      value: Buffer.from(communityPostValidationServiceApi.ValidatePostRequest.encode(request3).finish()),
    });
    const unpacked3 = communityPostValidationServiceApi.ValidatePostRequest.decode(envelope3.value);
    const invoke3: Unary<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse> =
      (input, done) => this.communityPostValidationClient.validatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>(invoke3, unpacked3);
    const request4 = contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (reply1?.forum?.location?.lines ?? []).map((value) => value),
          postalCode: (reply1?.forum?.location?.postalCode ?? ""),
        },
      },
    });
    const client4 = this.clients.get<contentContentRevisionCalculationServiceApi.ContentRevisionCalculationServiceClient>("acme.content.v1.ContentRevisionCalculationService");
    const invoke4: Unary<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse> =
      (input, done) => client4.calculateContentRevision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<contentContentRevisionCalculationServiceApi.CalculateContentRevisionRequest, contentContentRevisionCalculationServiceApi.CalculateContentRevisionResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.SignalForumWorkflowResponse.fromPartial({
        forum: {
          audit: { createdAt: reply1?.forum?.audit?.createdAt },
          children: [{ children: [{ location: reply1?.forum?.location }] }],
        },
      }),
      communityForumWorkflowServiceApi.SignalForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            location: { countryCode: (reply2?.post?.billingAddress?.countryCode ?? "") },
          }],
        },
        result: { details: (reply2?.result?.details ?? {}) },
      }),
      communityForumWorkflowServiceApi.SignalForumWorkflowResponse.fromPartial({
        forum: {
          children: [{
            location: { postalCode: (reply3?.post?.billingAddress?.postalCode ?? "") },
          }],
        },
      }),
      communityForumWorkflowServiceApi.SignalForumWorkflowResponse.fromPartial({
        forum: {
          attributes: (reply4?.contentRevision?.attributes ?? {}),
          children: [{
            children: [{
              manager: { displayName: (reply4?.contentRevision?.subject?.displayName ?? "") },
            }],
          }],
        },
      }),
      communityForumWorkflowServiceApi.SignalForumWorkflowResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          status: req?.forum?.status,
        },
      }),
    );
  }

  /**
   * Starts a forum.
   */
  async startForumWorkflow(req: communityForumWorkflowServiceApi.StartForumWorkflowRequest): Promise<communityForumWorkflowServiceApi.StartForumWorkflowResponse> {
    validateContext(req.context);
    if (req.forum) {
      await this.repository.save(toForumRecord(req.context.tenantId, req.forum));
    }
    await this.repository.record(req.context.tenantId, "StartForumWorkflow", req);
    this.logger.info("start_forum_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          email: (req?.forum?.manager?.email ?? ""),
          name: req?.details?.notify?.name,
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const invoke1: Unary<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> =
      (input, done) => this.customersConsentRecordValidationClient.validateConsentRecord(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<customersConsentRecordValidationServiceApi.ValidateConsentRecordRequest, customersConsentRecordValidationServiceApi.ValidateConsentRecordResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { etag: (req?.forum?.audit?.etag ?? "") },
        billingAddress: {
          lines: (req?.forum?.location?.lines ?? []).map((value) => value),
          region: (req?.forum?.location?.region ?? ""),
        },
      },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityForumWorkflowServiceApi.StartForumWorkflowResponse.fromPartial({ outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") } }),
      communityForumWorkflowServiceApi.StartForumWorkflowResponse.fromPartial({
        forum: { audit: { updatedBy: (reply2?.post?.audit?.updatedBy ?? "") } },
      }),
      communityForumWorkflowServiceApi.StartForumWorkflowResponse.fromPartial({
        forum: {
          forumId: (req?.forumId ?? ""),
          parentId: (req?.forum?.parentId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for ForumWorkflowService; workflows own validation and database transactions.
 */
@injectable()
export class ForumWorkflowHandler {
  constructor(@inject(ForumWorkflowWorkflow) private readonly workflow: ForumWorkflowWorkflow) {}

  /**
   * Advances a forum.
   */
  advanceForumWorkflow = unary<communityForumWorkflowServiceApi.AdvanceForumWorkflowRequest, communityForumWorkflowServiceApi.AdvanceForumWorkflowResponse>(
    (request) => this.workflow.advanceForumWorkflow(request),
  );

  /**
   * Cancels a forum.
   */
  cancelForumWorkflow = unary<communityForumWorkflowServiceApi.CancelForumWorkflowRequest, communityForumWorkflowServiceApi.CancelForumWorkflowResponse>(
    (request) => this.workflow.cancelForumWorkflow(request),
  );

  /**
   * Returns a forum.
   */
  inspectForumWorkflow = (call: ServerUnaryCall<communityForumWorkflowServiceApi.InspectForumWorkflowRequest, communityForumWorkflowServiceApi.InspectForumWorkflowResponse>, done: sendUnaryData<communityForumWorkflowServiceApi.InspectForumWorkflowResponse>): void => {
    void this.workflow.inspectForumWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Pauses a forum.
   */
  pauseForumWorkflow = unary<communityForumWorkflowServiceApi.PauseForumWorkflowRequest, communityForumWorkflowServiceApi.PauseForumWorkflowResponse>(
    (request) => this.workflow.pauseForumWorkflow(request),
  );

  /**
   * Resumes a forum.
   */
  resumeForumWorkflow = unary<communityForumWorkflowServiceApi.ResumeForumWorkflowRequest, communityForumWorkflowServiceApi.ResumeForumWorkflowResponse>(
    (request) => this.workflow.resumeForumWorkflow(request),
  );

  /**
   * Retrys a forum.
   */
  retryForumWorkflow = (call: ServerUnaryCall<communityForumWorkflowServiceApi.RetryForumWorkflowRequest, communityForumWorkflowServiceApi.RetryForumWorkflowResponse>, done: sendUnaryData<communityForumWorkflowServiceApi.RetryForumWorkflowResponse>): void => {
    void this.workflow.retryForumWorkflow(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Signals a forum.
   */
  signalForumWorkflow = unary<communityForumWorkflowServiceApi.SignalForumWorkflowRequest, communityForumWorkflowServiceApi.SignalForumWorkflowResponse>(
    (request) => this.workflow.signalForumWorkflow(request),
  );

  /**
   * Starts a forum.
   */
  startForumWorkflow = unary<communityForumWorkflowServiceApi.StartForumWorkflowRequest, communityForumWorkflowServiceApi.StartForumWorkflowResponse>(
    (request) => this.workflow.startForumWorkflow(request),
  );
}

export function implementation(handler: ForumWorkflowHandler): communityForumWorkflowServiceApi.ForumWorkflowServiceServer {
  return {
    advanceForumWorkflow: handler.advanceForumWorkflow,
    cancelForumWorkflow: handler.cancelForumWorkflow,
    inspectForumWorkflow: handler.inspectForumWorkflow,
    pauseForumWorkflow: handler.pauseForumWorkflow,
    resumeForumWorkflow: handler.resumeForumWorkflow,
    retryForumWorkflow: handler.retryForumWorkflow,
    signalForumWorkflow: handler.signalForumWorkflow,
    startForumWorkflow: handler.startForumWorkflow,
  };
}
