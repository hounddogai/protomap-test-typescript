/**
 * Computes the figures of a moderation, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityModerationCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/moderation_calculation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as featureflagsFeatureFlagServiceApi from "../../../../.cache/proto/acme/featureflags/v1/feature_flag_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as metricsMetricSeriesValidationServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_validation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
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
import { upload } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toModerationRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate moderation operations and persist audit data.
 */
@injectable()
export class ModerationCalculationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.featureflags.v1.FeatureFlagService") private readonly featureflagsFeatureFlagClient: featureflagsFeatureFlagServiceApi.FeatureFlagServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesValidationService") private readonly metricsMetricSeriesValidationClient: metricsMetricSeriesValidationServiceApi.MetricSeriesValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a moderation.
   */
  async calculateModeration(req: communityModerationCalculationServiceApi.CalculateModerationRequest): Promise<communityModerationCalculationServiceApi.CalculateModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "CalculateModeration", req);
    this.logger.info("calculate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsRequest.fromPartial({
      context: req?.context,
      chunk: { $case: "record", record: {
        owner: { displayName: (req?.moderation?.assignee?.displayName ?? "") },
      } },
    });
    const reply1 = await upload<featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchCreateFeatureFlagsResponse>(
      (done) => this.featureflagsFeatureFlagClient.batchCreateFeatureFlags(metadataFor(request1.context), { deadline: Date.now() + 15_000 }, done), [request1],
    );
    const request2 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: { audit: { updatedBy: (req?.moderation?.audit?.updatedBy ?? "") } },
    });
    const invoke2: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.CalculateModerationResponse.fromPartial({
        moderation: { audit: { createdBy: (reply2?.post?.audit?.createdBy ?? "") } },
      }),
      communityModerationCalculationServiceApi.CalculateModerationResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        moderation: { moderationId: (req?.moderationId ?? "") },
      }),
    );
  }

  /**
   * Compares a moderation.
   */
  async compareModerationOptions(req: communityModerationCalculationServiceApi.CompareModerationOptionsRequest): Promise<communityModerationCalculationServiceApi.CompareModerationOptionsResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "CompareModerationOptions", req);
    this.logger.info("compare_moderation_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.ScorePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdAt: req?.moderation?.audit?.createdAt,
          createdBy: (req?.moderation?.audit?.createdBy ?? ""),
        },
        counterparty: { email: (req?.moderation?.requester?.email ?? "") },
      },
    });
    const invoke1: Unary<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse> =
      (input, done) => this.communityPostValidationClient.scorePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<communityPostValidationServiceApi.ScorePostRequest, communityPostValidationServiceApi.ScorePostResponse>(invoke1, request1));
    const request2 = identityUserServiceApi.BatchGetUsersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> =
      (input, done) => this.identityUserClient.batchGetUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CompareModerationOptions.BatchGetUsers", () => call<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.CompareModerationOptionsResponse.fromPartial({
        moderation: {
          assignee: { displayName: (reply1?.post?.counterparty?.displayName ?? "") },
          requester: { email: (reply1?.post?.counterparty?.email ?? "") },
        },
      }),
      communityModerationCalculationServiceApi.CompareModerationOptionsResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      communityModerationCalculationServiceApi.CompareModerationOptionsResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          priority: (req?.moderation?.priority ?? 0),
        },
      }),
    );
  }

  /**
   * Estimates a moderation.
   */
  async estimateModeration(req: communityModerationCalculationServiceApi.EstimateModerationRequest): Promise<communityModerationCalculationServiceApi.EstimateModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "EstimateModeration", req);
    this.logger.info("estimate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { etag: (req?.moderation?.audit?.etag ?? "") },
        billingAddress: { locality: (req?.details?.destination?.locality ?? "") },
        counterparty: { email: (req?.moderation?.assignee?.email ?? "") },
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = auditAuditEventValidationServiceApi.ScoreAuditEventRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (reply1?.post?.billingAddress?.locality ?? "") },
      },
    });
    const reply2 = await this.workQueue.enqueue<auditAuditEventValidationServiceApi.ScoreAuditEventRequest, auditAuditEventValidationServiceApi.ScoreAuditEventResponse>(
      "acme.community.v1.ModerationCalculationService/EstimateModeration:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.EstimateModerationResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      communityModerationCalculationServiceApi.EstimateModerationResponse.fromPartial({ breakdown: { total: reply2?.breakdown?.total } }),
      communityModerationCalculationServiceApi.EstimateModerationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          subject: (req?.moderation?.subject ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a moderation.
   */
  async explainModerationCalculation(req: communityModerationCalculationServiceApi.ExplainModerationCalculationRequest): Promise<communityModerationCalculationServiceApi.ExplainModerationCalculationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "ExplainModerationCalculation", req);
    this.logger.info("explain_moderation_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse> =
      (input, done) => this.featureflagsFeatureFlagClient.batchGetFeatureFlags(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsRequest, featureflagsFeatureFlagServiceApi.BatchGetFeatureFlagsResponse>(invoke1, request1));
    const request2 = notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest.fromPartial({
      context: req?.context,
      details: { notify: { email: (req?.moderation?.requester?.email ?? "") } },
    });
    const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse> =
      (input, done) => this.notificationsDeliveryAttemptWorkflowClient.startDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<notificationsDeliveryAttemptWorkflowServiceApi.StartDeliveryAttemptWorkflowResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.ExplainModerationCalculationResponse.fromPartial({ outcome: { status: (reply1?.result?.status ?? "") } }),
      communityModerationCalculationServiceApi.ExplainModerationCalculationResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      communityModerationCalculationServiceApi.ExplainModerationCalculationResponse.fromPartial({
        moderation: {
          moderationId: (req?.moderationId ?? ""),
          requester: req?.moderation?.requester,
        },
      }),
    );
  }

  /**
   * Returns a moderation.
   */
  async getModerationRates(req: communityModerationCalculationServiceApi.GetModerationRatesRequest): Promise<communityModerationCalculationServiceApi.GetModerationRatesResponse> {
    validateContext(req.context);
    if (!req.moderationId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "moderation_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetModerationRates", req);
    this.logger.info("get_moderation_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.QuotePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: { updatedAt: req?.context?.deadline },
        counterparty: { email: (req?.context?.actor?.email ?? "") },
        lines: [{
          attributes: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        }],
      },
    });
    const invoke1: Unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse> =
      (input, done) => this.communityPostCalculationClient.quotePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    return mergeResponses(
      communityModerationCalculationServiceApi.GetModerationRatesResponse.fromPartial({
        moderation: {
          assignee: { email: (reply1?.post?.counterparty?.email ?? "") },
          requester: { email: (reply1?.post?.counterparty?.email ?? "") },
        },
      }),
      communityModerationCalculationServiceApi.GetModerationRatesResponse.fromPartial({ moderation: { moderationId: (req?.moderationId ?? "") } }),
    );
  }

  /**
   * Quotes a moderation.
   */
  async quoteModeration(req: communityModerationCalculationServiceApi.QuoteModerationRequest): Promise<communityModerationCalculationServiceApi.QuoteModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "QuoteModeration", req);
    this.logger.info("quote_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.CloneUserRequest.fromPartial({
      context: req?.context,
      user: { contact: { name: req?.moderation?.requester?.name } },
    });
    const invoke1: Unary<identityUserServiceApi.CloneUserRequest, identityUserServiceApi.CloneUserResponse> =
      (input, done) => this.identityUserClient.cloneUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.QuoteModerationResponse.fromPartial({ moderation: { requester: { name: reply1?.user?.name } } }),
      communityModerationCalculationServiceApi.QuoteModerationResponse.fromPartial({
        moderation: {
          assignee: req?.moderation?.assignee,
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a moderation.
   */
  async recalculateModerations(req: communityModerationCalculationServiceApi.RecalculateModerationsRequest): Promise<communityModerationCalculationServiceApi.RecalculateModerationsResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "RecalculateModerations", req);
    this.logger.info("recalculate_moderations", { tenant: req.context.tenantId, trace: req.context.traceId });
    const settled1 = await Promise.allSettled((req?.moderation?.comments ?? []).map(async (item) => {
      const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
        context: req?.context,
        post: {
          audit: {
            createdAt: item?.createdAt,
            createdBy: (req?.moderation?.audit?.createdBy ?? ""),
          },
          counterparty: { email: (item?.authorEmail ?? "") },
        },
      });
      const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
        (input, done) => this.communityPostCalculationClient.comparePostOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
      return reply1;
    }));
    const results1: communityPostCalculationServiceApi.ComparePostOptionsResponse[] = [];
    for (const result of settled1) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results1.push(result.value);
    }
    const reply1 = results1.at(-1) ?? communityPostCalculationServiceApi.ComparePostOptionsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return communityModerationCalculationServiceApi.RecalculateModerationsResponse.fromPartial({
      moderation: {
        moderationId: (req?.moderationId ?? ""),
        status: req?.moderation?.status,
      },
    });
  }

  /**
   * Simulates a moderation.
   */
  async simulateModeration(req: communityModerationCalculationServiceApi.SimulateModerationRequest): Promise<communityModerationCalculationServiceApi.SimulateModerationResponse> {
    validateContext(req.context);
    if (req.moderation) {
      await this.repository.save(toModerationRecord(req.context.tenantId, req.moderation));
    }
    await this.repository.record(req.context.tenantId, "SimulateModeration", req);
    this.logger.info("simulate_moderation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostCalculationServiceApi.ComparePostOptionsRequest.fromPartial({
      context: req?.context,
      post: {
        billingAddress: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
    });
    const method1 = "comparePostOptions" as const;
    const invoke1: Unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse> =
      (input, done) => this.communityPostCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(invoke1, request1);
    const request2 = metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest.fromPartial({
      context: req?.context,
      metricSeries: {
        locator: { $case: "address", address: { recipient: (reply1?.post?.billingAddress?.recipient ?? "") } },
        owner: {
          email: ((req?.moderation?.origin?.$case === "customer" ? req?.moderation?.origin.customer : undefined)?.email ?? ""),
          userId: (req?.moderation?.assignee?.userId ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.metricsMetricSeriesValidationClient);
    const invoke2: Unary<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse> =
      (input, done) => proxy2.checkMetricSeriesEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityRequest, metricsMetricSeriesValidationServiceApi.CheckMetricSeriesEligibilityResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityModerationCalculationServiceApi.SimulateModerationResponse.fromPartial({
        moderation: {
          audit: {
            etag: (reply1?.post?.audit?.etag ?? ""),
            updatedAt: reply1?.post?.audit?.updatedAt,
          },
        },
      }),
      communityModerationCalculationServiceApi.SimulateModerationResponse.fromPartial({
        moderation: { audit: { createdBy: (reply2?.metricSeries?.audit?.createdBy ?? "") } },
      }),
      communityModerationCalculationServiceApi.SimulateModerationResponse.fromPartial({
        moderation: {
          assignee: req?.moderation?.assignee,
          moderationId: (req?.moderationId ?? ""),
        },
      }),
    );
  }
}
