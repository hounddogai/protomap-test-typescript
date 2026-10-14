/**
 * Computes the figures of a post, such as totals, taxes, and estimates. Remote work stays behind typed client ports.
 */

import * as appointmentsAppointmentQueryServiceApi from "../../../../.cache/proto/acme/appointments/v1/appointment_query_service.js";
import * as communityPostCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as featurestoreFeatureViewQueryServiceApi from "../../../../.cache/proto/acme/featurestore/v1/feature_view_query_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as ledgerLedgerAccountValidationServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_validation_service.js";
import * as metricsMetricSeriesQueryServiceApi from "../../../../.cache/proto/acme/metrics/v1/metric_series_query_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, operation, promised, retry, type Unary, workflow } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toPostRecord } from "../data/records.js";
import { CommunityRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate post operations and persist audit data.
 */
@injectable()
export class PostCalculationWorkflow {
  constructor(
    @inject(CommunityRepository) private readonly repository: CommunityRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.appointments.v1.AppointmentQueryService") private readonly appointmentsAppointmentQueryClient: appointmentsAppointmentQueryServiceApi.AppointmentQueryServiceClient,
    @inject("grpc:acme.featurestore.v1.FeatureViewQueryService") private readonly featurestoreFeatureViewQueryClient: featurestoreFeatureViewQueryServiceApi.FeatureViewQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountQueryService") private readonly ledgerLedgerAccountQueryClient: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountValidationService") private readonly ledgerLedgerAccountValidationClient: ledgerLedgerAccountValidationServiceApi.LedgerAccountValidationServiceClient,
    @inject("grpc:acme.metrics.v1.MetricSeriesQueryService") private readonly metricsMetricSeriesQueryClient: metricsMetricSeriesQueryServiceApi.MetricSeriesQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a post.
   */
  async calculatePost(req: communityPostCalculationServiceApi.CalculatePostRequest): Promise<communityPostCalculationServiceApi.CalculatePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "CalculatePost", req);
    this.logger.info("calculate_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      filter: {
        ownerId: (req?.post?.counterparty?.profileId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream1 = this.notificationsNotificationTemplateExportClient.streamNotificationTemplateExport(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
    const messages1 = await collect(stream1);
    const reply1 = messages1.at(-1) ?? notificationsNotificationTemplateExportServiceApi.StreamNotificationTemplateExportResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return communityPostCalculationServiceApi.CalculatePostResponse.fromPartial({
      post: {
        dueAt: req?.post?.dueAt,
        postId: (req?.postId ?? ""),
      },
    });
  }

  /**
   * Compares a post.
   */
  async comparePostOptions(req: communityPostCalculationServiceApi.ComparePostOptionsRequest): Promise<communityPostCalculationServiceApi.ComparePostOptionsResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "ComparePostOptions", req);
    this.logger.info("compare_post_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.details?.destination?.postalCode ?? ""),
          recipient: (req?.post?.billingAddress?.recipient ?? ""),
        },
      },
      subscription: { owner: { email: (req?.post?.counterparty?.email ?? "") } },
    });
    const invoke1: Unary<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.estimateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.EstimateSubscriptionResponse>(invoke1, request1));
    const request2 = identityUserValidationServiceApi.ValidateUserRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.post?.counterparty?.email ?? "") } },
      user: {
        primaryAddress: {
          countryCode: (req?.details?.destination?.countryCode ?? ""),
          locality: (req?.details?.destination?.locality ?? ""),
          recipient: (req?.post?.billingAddress?.recipient ?? ""),
        },
      },
    });
    const invoke2: Unary<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse> =
      (input, done) => this.identityUserValidationClient.validateUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ComparePostOptions.ValidateUser", () => call<identityUserValidationServiceApi.ValidateUserRequest, identityUserValidationServiceApi.ValidateUserResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostCalculationServiceApi.ComparePostOptionsResponse.fromPartial({
        post: {
          lines: [{
            amount: (reply1?.subscription?.action?.$case === "discount" ? reply1?.subscription?.action.discount : undefined)?.amount,
          }],
        },
      }),
      communityPostCalculationServiceApi.ComparePostOptionsResponse.fromPartial({
        post: {
          billingAddress: { locality: (reply2?.user?.primaryAddress?.locality ?? "") },
        },
      }),
      communityPostCalculationServiceApi.ComparePostOptionsResponse.fromPartial({
        post: {
          postId: (req?.postId ?? ""),
          total: req?.post?.total,
        },
      }),
    );
  }

  /**
   * Estimates a post.
   */
  async estimatePost(req: communityPostCalculationServiceApi.EstimatePostRequest): Promise<communityPostCalculationServiceApi.EstimatePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "EstimatePost", req);
    this.logger.info("estimate_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = appointmentsAppointmentQueryServiceApi.ResolveAppointmentsRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<appointmentsAppointmentQueryServiceApi.ResolveAppointmentsRequest, appointmentsAppointmentQueryServiceApi.ResolveAppointmentsResponse> =
      (input, done) => this.appointmentsAppointmentQueryClient.resolveAppointments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostCalculationServiceApi.EstimatePostResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      communityPostCalculationServiceApi.EstimatePostResponse.fromPartial({
        post: {
          counterparty: req?.post?.counterparty,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a post.
   */
  async getPostRates(req: communityPostCalculationServiceApi.GetPostRatesRequest): Promise<communityPostCalculationServiceApi.GetPostRatesResponse> {
    validateContext(req.context);
    if (!req.postId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "post_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetPostRates", req);
    this.logger.info("get_post_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest.fromPartial({
      context: req?.context,
      details: {
        contact: { email: (req?.context?.actor?.email ?? "") },
        locale: (req?.context?.locale ?? ""),
      },
      ledgerAccount: {
        audit: { createdAt: req?.context?.deadline },
        funding: { $case: "externalAccountId", externalAccountId: (req?.postId ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountRequest, ledgerLedgerAccountValidationServiceApi.NormalizeLedgerAccountResponse>(
      "acme.community.v1.PostCalculationService/GetPostRates:0", request1,
    );
    return mergeResponses(
      communityPostCalculationServiceApi.GetPostRatesResponse.fromPartial({
        post: {
          counterparty: { displayName: (reply1?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      communityPostCalculationServiceApi.GetPostRatesResponse.fromPartial({ post: { postId: (req?.postId ?? "") } }),
    );
  }

  /**
   * Quotes a post.
   */
  async quotePost(req: communityPostCalculationServiceApi.QuotePostRequest): Promise<communityPostCalculationServiceApi.QuotePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "QuotePost", req);
    this.logger.info("quote_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "card":
        selected1_2 = ((req?.post?.settlement?.$case === "card" ? req?.post?.settlement.card : undefined)?.network ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_4: string | undefined;
    switch (req?.post?.settlement?.$case) {
      case "card":
        selected1_4 = ((req?.post?.settlement?.$case === "card" ? req?.post?.settlement.card : undefined)?.holderName ?? "");
        break;
      default:
        selected1_4 = "";
    }
    const request1 = ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.post?.counterparty?.email ?? "") } },
      ledgerAccount: {
        audit: { updatedAt: req?.post?.audit?.updatedAt },
        funding: { $case: "card", card: {
          holderName: (selected1_4 ?? ""),
          network: (selected1_2 ?? ""),
        } },
      },
    });
    const invoke1: Unary<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse> =
      (input, done) => this.ledgerLedgerAccountValidationClient.checkLedgerAccountEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityRequest, ledgerLedgerAccountValidationServiceApi.CheckLedgerAccountEligibilityResponse>(invoke1, request1);
    const request2 = ledgerLedgerAccountQueryServiceApi.ExportLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.ledgerAccount?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((reply1?.ledgerAccount?.labels ?? {}))),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream2 = this.ledgerLedgerAccountQueryClient.exportLedgerAccounts(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? ledgerLedgerAccountQueryServiceApi.ExportLedgerAccountsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      communityPostCalculationServiceApi.QuotePostResponse.fromPartial({
        post: {
          counterparty: { displayName: (reply1?.ledgerAccount?.holder?.displayName ?? "") },
        },
      }),
      communityPostCalculationServiceApi.QuotePostResponse.fromPartial({
        post: {
          issuedAt: req?.post?.issuedAt,
          postId: (req?.postId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a post.
   */
  async simulatePost(req: communityPostCalculationServiceApi.SimulatePostRequest): Promise<communityPostCalculationServiceApi.SimulatePostResponse> {
    validateContext(req.context);
    if (req.post) {
      await this.repository.save(toPostRecord(req.context.tenantId, req.post));
    }
    await this.repository.record(req.context.tenantId, "SimulatePost", req);
    this.logger.info("simulate_post", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = featurestoreFeatureViewQueryServiceApi.BrowseFeatureViewsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.post?.audit?.updatedAt,
        ownerId: (req?.post?.counterparty?.profileId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<featurestoreFeatureViewQueryServiceApi.BrowseFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.BrowseFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewQueryClient.browseFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<featurestoreFeatureViewQueryServiceApi.BrowseFeatureViewsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.result?.details ?? {}))),
      },
      reason: (req?.reason ?? ""),
    });
    const invoke2: Unary<featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsRequest, featurestoreFeatureViewQueryServiceApi.SummarizeFeatureViewsResponse> =
      (input, done) => this.featurestoreFeatureViewQueryClient.summarizeFeatureViews(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.post?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke3: Unary<metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesRequest, metricsMetricSeriesQueryServiceApi.BrowseMetricSeriesesResponse> =
      (input, done) => this.metricsMetricSeriesQueryClient.browseMetricSerieses(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      communityPostCalculationServiceApi.SimulatePostResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      communityPostCalculationServiceApi.SimulatePostResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      communityPostCalculationServiceApi.SimulatePostResponse.fromPartial({
        result: {
          message: (reply3?.result?.message ?? ""),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      communityPostCalculationServiceApi.SimulatePostResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        post: { postId: (req?.postId ?? "") },
      }),
    );
  }
}

/**
 * The gRPC boundary for PostCalculationService; workflows own validation and database transactions.
 */
@injectable()
export class PostCalculationHandler {
  constructor(@inject(PostCalculationWorkflow) private readonly workflow: PostCalculationWorkflow) {}

  /**
   * Calculates a post.
   */
  calculatePost = unary<communityPostCalculationServiceApi.CalculatePostRequest, communityPostCalculationServiceApi.CalculatePostResponse>(
    (request) => this.workflow.calculatePost(request),
  );

  /**
   * Compares a post.
   */
  comparePostOptions = unary<communityPostCalculationServiceApi.ComparePostOptionsRequest, communityPostCalculationServiceApi.ComparePostOptionsResponse>(
    (request) => this.workflow.comparePostOptions(request),
  );

  /**
   * Estimates a post.
   */
  estimatePost = (call: ServerUnaryCall<communityPostCalculationServiceApi.EstimatePostRequest, communityPostCalculationServiceApi.EstimatePostResponse>, done: sendUnaryData<communityPostCalculationServiceApi.EstimatePostResponse>): void => {
    void this.workflow.estimatePost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns a post.
   */
  getPostRates = unary<communityPostCalculationServiceApi.GetPostRatesRequest, communityPostCalculationServiceApi.GetPostRatesResponse>(
    (request) => this.workflow.getPostRates(request),
  );

  /**
   * Quotes a post.
   */
  quotePost = unary<communityPostCalculationServiceApi.QuotePostRequest, communityPostCalculationServiceApi.QuotePostResponse>(
    (request) => this.workflow.quotePost(request),
  );

  /**
   * Simulates a post.
   */
  simulatePost = (call: ServerUnaryCall<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>, done: sendUnaryData<communityPostCalculationServiceApi.SimulatePostResponse>): void => {
    void this.workflow.simulatePost(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: PostCalculationHandler): communityPostCalculationServiceApi.PostCalculationServiceServer {
  return {
    calculatePost: handler.calculatePost,
    comparePostOptions: handler.comparePostOptions,
    estimatePost: handler.estimatePost,
    getPostRates: handler.getPostRates,
    quotePost: handler.quotePost,
    simulatePost: handler.simulatePost,
  };
}
