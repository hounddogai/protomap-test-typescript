/**
 * Computes the figures of a variant, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as auditAuditEventValidationServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityForumQueryServiceApi from "../../../../.cache/proto/acme/community/v1/forum_query_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as experimentsVariantCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_calculation_service.js";
import * as notificationsNotificationCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_calculation_service.js";
import * as notificationsNotificationTemplateHistoryServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_history_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, serviceError } from "../../../platform/errors.js";
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
  retry,
  type RequestPort,
  type Unary,
  workflow,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toVariantRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate variant operations and persist audit data.
 */
@injectable()
export class VariantCalculationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.audit.v1.AuditEventValidationService") private readonly auditAuditEventValidationClient: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient,
    @inject("grpc:acme.community.v1.ForumQueryService") private readonly communityForumQueryClient: communityForumQueryServiceApi.ForumQueryServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentCalculationService") private readonly experimentsExperimentCalculationClient: experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationCalculationService") private readonly notificationsNotificationCalculationClient: notificationsNotificationCalculationServiceApi.NotificationCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateHistoryService") private readonly notificationsNotificationTemplateHistoryClient: notificationsNotificationTemplateHistoryServiceApi.NotificationTemplateHistoryServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a variant.
   */
  async calculateVariant(req: experimentsVariantCalculationServiceApi.CalculateVariantRequest): Promise<experimentsVariantCalculationServiceApi.CalculateVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "CalculateVariant", req);
    this.logger.info("calculate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      auditEvent: { subject: { displayName: (req?.variant?.owner?.displayName ?? "") } },
      context: req?.context,
      details: { contact: { email: (req?.variant?.owner?.email ?? "") } },
      reason: (req?.reason ?? ""),
    });
    const method1 = "checkAuditEventEligibility" as const;
    const invoke1: Unary<auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest, auditAuditEventValidationServiceApi.CheckAuditEventEligibilityResponse> =
      (input, done) => this.auditAuditEventValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventValidationServiceApi.CheckAuditEventEligibilityRequest, auditAuditEventValidationServiceApi.CheckAuditEventEligibilityResponse>(invoke1, request1);
    const request2 = personalizationProfileCalculationServiceApi.RecalculateProfilesRequest.fromPartial({
      context: req?.context,
      profile: {
        identityDocument: { $case: "nationalId", nationalId: { number: (reply1?.auditEvent?.subject?.number ?? "") } },
        primaryAddress: { locality: (req?.details?.destination?.locality ?? "") },
        relationshipManager: { displayName: (req?.variant?.owner?.displayName ?? "") },
      },
    });
    const proxy2 = forwarding(this.personalizationProfileCalculationClient);
    const invoke2: Unary<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse> =
      (input, done) => proxy2.recalculateProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationProfileCalculationServiceApi.RecalculateProfilesRequest, personalizationProfileCalculationServiceApi.RecalculateProfilesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.CalculateVariantResponse.fromPartial({ result: { correlationId: (reply1?.auditEvent?.correlationId ?? "") } }),
      experimentsVariantCalculationServiceApi.CalculateVariantResponse.fromPartial({
        result: { details: (reply2?.result?.details ?? {}) },
        variant: { audit: { createdBy: (reply2?.profile?.audit?.createdBy ?? "") } },
      }),
      experimentsVariantCalculationServiceApi.CalculateVariantResponse.fromPartial({
        variant: {
          name: (req?.variant?.name ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a variant.
   */
  async compareVariantOptions(req: experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest): Promise<experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "CompareVariantOptions", req);
    this.logger.info("compare_variant_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { updatedAt: req?.variant?.audit?.updatedAt },
        location: { recipient: (req?.details?.destination?.recipient ?? "") },
        organizer: { userId: (req?.variant?.owner?.userId ?? "") },
      },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.recalculateExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest, experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse>(invoke1, request1);
    const request2 = experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest.fromPartial({
      context: req?.context,
      experiment: {
        audit: { createdAt: req?.variant?.audit?.createdAt },
        location: { postalCode: (reply1?.experiment?.location?.postalCode ?? "") },
        organizer: { displayName: (req?.variant?.owner?.displayName ?? "") },
        participants: [{ contact: { email: (req?.variant?.owner?.email ?? "") } }],
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.explainExperimentCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest, experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        variant: { audit: { createdAt: reply2?.experiment?.audit?.createdAt } },
      }),
      experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse.fromPartial({
        variant: {
          priority: (req?.variant?.priority ?? 0),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a variant.
   */
  async estimateVariant(req: experimentsVariantCalculationServiceApi.EstimateVariantRequest): Promise<experimentsVariantCalculationServiceApi.EstimateVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "EstimateVariant", req);
    this.logger.info("estimate_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = auditAuditEventServiceApi.ListAuditEventsRequest.fromPartial({
      context: input1?.context,
      filter: { region: (input1?.details?.destination?.region ?? "") },
    });
    const invoke1: Unary<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse> =
      (input, done) => this.auditAuditEventClient.listAuditEvents(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<auditAuditEventServiceApi.ListAuditEventsRequest, auditAuditEventServiceApi.ListAuditEventsResponse>(invoke1, request1);
    const request2 = experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest.fromPartial({
      context: req?.context,
      experiment: { audit: { updatedBy: (req?.variant?.audit?.updatedBy ?? "") } },
    });
    const cloned2: experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.compareExperimentOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest, experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.EstimateVariantResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsVariantCalculationServiceApi.EstimateVariantResponse.fromPartial({ variant: { audit: { etag: (reply2?.experiment?.audit?.etag ?? "") } } }),
      experimentsVariantCalculationServiceApi.EstimateVariantResponse.fromPartial({
        variant: {
          owner: req?.variant?.owner,
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a variant.
   */
  async explainVariantCalculation(req: experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest): Promise<experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "ExplainVariantCalculation", req);
    this.logger.info("explain_variant_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: { audit: { updatedBy: (req?.variant?.audit?.updatedBy ?? "") } },
    });
    const decoded1 = searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest.fromJSON(
      JSON.parse(JSON.stringify(searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest.toJSON(request1))),
    );
    const invoke1: Unary<searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest, searchSearchIndexValidationServiceApi.ScoreSearchIndexResponse> =
      (input, done) => this.searchSearchIndexValidationClient.scoreSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest, searchSearchIndexValidationServiceApi.ScoreSearchIndexResponse>(invoke1, decoded1);
    const request2 = communityPostCalculationServiceApi.EstimatePostRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          region: ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.region ?? ""),
        },
      },
      post: {
        billingAddress: {
          postalCode: ((reply1?.searchIndex?.locator?.$case === "address" ? reply1?.searchIndex?.locator.address : undefined)?.postalCode ?? ""),
        },
        counterparty: { email: (reply1?.searchIndex?.owner?.email ?? "") },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.community.v1.EstimatePostRequest",
      value: Buffer.from(communityPostCalculationServiceApi.EstimatePostRequest.encode(request2).finish()),
    });
    const unpacked2 = communityPostCalculationServiceApi.EstimatePostRequest.decode(envelope2.value);
    const invoke2: Unary<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse> =
      (input, done) => this.communityPostCalculationClient.estimatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse.fromPartial({
        variant: {
          audit: { updatedBy: (reply2?.post?.audit?.updatedBy ?? "") },
          owner: { displayName: (reply2?.post?.counterparty?.displayName ?? "") },
        },
      }),
      experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse.fromPartial({
        variant: {
          name: (req?.variant?.name ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a variant.
   */
  async getVariantRates(req: experimentsVariantCalculationServiceApi.GetVariantRatesRequest): Promise<experimentsVariantCalculationServiceApi.GetVariantRatesResponse> {
    validateContext(req.context);
    if (!req.variantId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "variant_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetVariantRates", req);
    this.logger.info("get_variant_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityForumQueryServiceApi.SummarizeForumsRequest.fromPartial({
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const client1 = this.clients.get<communityForumQueryServiceApi.ForumQueryServiceClient>("acme.community.v1.ForumQueryService");
    const invoke1: Unary<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse> =
      (input, done) => client1.summarizeForums(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityForumQueryServiceApi.SummarizeForumsRequest, communityForumQueryServiceApi.SummarizeForumsResponse>(invoke1, request1);
    return mergeResponses(
      experimentsVariantCalculationServiceApi.GetVariantRatesResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      experimentsVariantCalculationServiceApi.GetVariantRatesResponse.fromPartial({ variant: { variantId: (req?.variantId ?? "") } }),
    );
  }

  /**
   * Quotes a variant.
   */
  async quoteVariant(req: experimentsVariantCalculationServiceApi.QuoteVariantRequest): Promise<experimentsVariantCalculationServiceApi.QuoteVariantResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "QuoteVariant", req);
    this.logger.info("quote_variant", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationCalculationServiceApi.QuoteNotificationRequest.fromPartial({
      context: req?.context,
      details: { destination: { region: (req?.details?.destination?.region ?? "") } },
      notification: { audit: { updatedBy: (req?.variant?.audit?.updatedBy ?? "") } },
    });
    const invoke1: Unary<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> =
      (input, done) => this.notificationsNotificationCalculationClient.quoteNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<notificationsNotificationCalculationServiceApi.QuoteNotificationRequest, notificationsNotificationCalculationServiceApi.QuoteNotificationResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        audit: {
          createdBy: (req?.variant?.audit?.createdBy ?? ""),
          updatedAt: reply1?.notification?.audit?.updatedAt,
          updatedBy: (req?.variant?.audit?.updatedBy ?? ""),
        },
        lines: [{
          amount: (req?.variant?.action?.$case === "discount" ? req?.variant?.action.discount : undefined)?.amount,
        }],
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest, notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateHistoryClient.revertNotificationTemplate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateRequest, notificationsNotificationTemplateHistoryServiceApi.RevertNotificationTemplateResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.QuoteVariantResponse.fromPartial({
        variant: { audit: { createdBy: (reply1?.notification?.audit?.createdBy ?? "") } },
      }),
      experimentsVariantCalculationServiceApi.QuoteVariantResponse.fromPartial({
        variant: {
          audit: { createdBy: (reply2?.notificationTemplate?.audit?.createdBy ?? "") },
        },
      }),
      experimentsVariantCalculationServiceApi.QuoteVariantResponse.fromPartial({
        variant: {
          priority: (req?.variant?.priority ?? 0),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a variant.
   */
  async recalculateVariants(req: experimentsVariantCalculationServiceApi.RecalculateVariantsRequest): Promise<experimentsVariantCalculationServiceApi.RecalculateVariantsResponse> {
    validateContext(req.context);
    if (req.variant) {
      await this.repository.save(toVariantRecord(req.context.tenantId, req.variant));
    }
    await this.repository.record(req.context.tenantId, "RecalculateVariants", req);
    this.logger.info("recalculate_variants", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { countryCode: (req?.details?.destination?.countryCode ?? "") },
      },
      experiment: { audit: { createdBy: (req?.variant?.audit?.createdBy ?? "") } },
    });
    const invoke1: Unary<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse> =
      (input, done) => this.experimentsExperimentCalculationClient.quoteExperiment(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("RecalculateVariants.QuoteExperiment", () => call<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse>(invoke1, request1));
    const request2 = communityForumValidationServiceApi.ScoreForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            audit: {
              createdBy: (req?.variant?.audit?.createdBy ?? ""),
              updatedAt: req?.variant?.audit?.updatedAt,
            },
            location: {
              locality: (reply1?.experiment?.location?.locality ?? ""),
              postalCode: (req?.details?.destination?.postalCode ?? ""),
            },
          }],
        }],
      },
    });
    const invoke2: Unary<communityForumValidationServiceApi.ScoreForumRequest, communityForumValidationServiceApi.ScoreForumResponse> =
      (input, done) => this.communityForumValidationClient.scoreForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsVariantCalculationServiceApi.RecalculateVariantsResponse.fromPartial({ breakdown: { currencyCode: (reply1?.breakdown?.currencyCode ?? "") } }),
      experimentsVariantCalculationServiceApi.RecalculateVariantsResponse.fromPartial({ variant: { owner: { email: (reply2?.forum?.manager?.email ?? "") } } }),
      experimentsVariantCalculationServiceApi.RecalculateVariantsResponse.fromPartial({
        variant: {
          name: (req?.variant?.name ?? ""),
          variantId: (req?.variantId ?? ""),
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for VariantCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class VariantCalculationHandler {
  constructor(@inject(VariantCalculationWorkflow) private readonly workflow: VariantCalculationWorkflow) {}

  /**
   * Calculates a variant.
   */
  calculateVariant = unary<experimentsVariantCalculationServiceApi.CalculateVariantRequest, experimentsVariantCalculationServiceApi.CalculateVariantResponse>(
    (request) => this.workflow.calculateVariant(request),
  );

  /**
   * Compares a variant.
   */
  compareVariantOptions = unary<experimentsVariantCalculationServiceApi.CompareVariantOptionsRequest, experimentsVariantCalculationServiceApi.CompareVariantOptionsResponse>(
    (request) => this.workflow.compareVariantOptions(request),
  );

  /**
   * Estimates a variant.
   */
  estimateVariant = (call: ServerUnaryCall<experimentsVariantCalculationServiceApi.EstimateVariantRequest, experimentsVariantCalculationServiceApi.EstimateVariantResponse>, done: sendUnaryData<experimentsVariantCalculationServiceApi.EstimateVariantResponse>): void => {
    void this.workflow.estimateVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Explains a variant.
   */
  explainVariantCalculation = unary<experimentsVariantCalculationServiceApi.ExplainVariantCalculationRequest, experimentsVariantCalculationServiceApi.ExplainVariantCalculationResponse>(
    (request) => this.workflow.explainVariantCalculation(request),
  );

  /**
   * Returns a variant.
   */
  getVariantRates = unary<experimentsVariantCalculationServiceApi.GetVariantRatesRequest, experimentsVariantCalculationServiceApi.GetVariantRatesResponse>(
    (request) => this.workflow.getVariantRates(request),
  );

  /**
   * Quotes a variant.
   */
  quoteVariant = (call: ServerUnaryCall<experimentsVariantCalculationServiceApi.QuoteVariantRequest, experimentsVariantCalculationServiceApi.QuoteVariantResponse>, done: sendUnaryData<experimentsVariantCalculationServiceApi.QuoteVariantResponse>): void => {
    void this.workflow.quoteVariant(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Recalculates a variant.
   */
  recalculateVariants = unary<experimentsVariantCalculationServiceApi.RecalculateVariantsRequest, experimentsVariantCalculationServiceApi.RecalculateVariantsResponse>(
    (request) => this.workflow.recalculateVariants(request),
  );
}

export function implementation(handler: VariantCalculationHandler): experimentsVariantCalculationServiceApi.VariantCalculationServiceServer {
  return {
    calculateVariant: handler.calculateVariant,
    compareVariantOptions: handler.compareVariantOptions,
    estimateVariant: handler.estimateVariant,
    explainVariantCalculation: handler.explainVariantCalculation,
    getVariantRates: handler.getVariantRates,
    quoteVariant: handler.quoteVariant,
    recalculateVariants: handler.recalculateVariants,
  };
}
