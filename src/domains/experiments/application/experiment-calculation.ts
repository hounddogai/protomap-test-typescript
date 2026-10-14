/**
 * Computes the figures of an experiment, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as auditAuditEventServiceApi from "../../../../.cache/proto/acme/audit/v1/audit_event_service.js";
import * as communityForumServiceApi from "../../../../.cache/proto/acme/community/v1/forum_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import * as fleetVehicleQueryServiceApi from "../../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as notificationsNotificationSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_sync_service.js";
import * as notificationsNotificationTemplateAdminServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_admin_service.js";
import * as notificationsNotificationTemplateCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_calculation_service.js";
import * as notificationsSubscriptionApprovalServiceApi from "../../../../.cache/proto/acme/notifications/v1/subscription_approval_service.js";
import * as personalizationProfileServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as secretsSecretQueryServiceApi from "../../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import { call, metadataFor, operation, promised, type Unary, workflow } from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toExperimentRecord } from "../data/records.js";
import { ExperimentsRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate experiment operations and persist audit data.
 */
@injectable()
export class ExperimentCalculationWorkflow {
  constructor(
    @inject(ExperimentsRepository) private readonly repository: ExperimentsRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audit.v1.AuditEventService") private readonly auditAuditEventClient: auditAuditEventServiceApi.AuditEventServiceClient,
    @inject("grpc:acme.community.v1.ForumService") private readonly communityForumClient: communityForumServiceApi.ForumServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleQueryService") private readonly fleetVehicleQueryClient: fleetVehicleQueryServiceApi.VehicleQueryServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationSyncService") private readonly notificationsNotificationSyncClient: notificationsNotificationSyncServiceApi.NotificationSyncServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateAdminService") private readonly notificationsNotificationTemplateAdminClient: notificationsNotificationTemplateAdminServiceApi.NotificationTemplateAdminServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateCalculationService") private readonly notificationsNotificationTemplateCalculationClient: notificationsNotificationTemplateCalculationServiceApi.NotificationTemplateCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionApprovalService") private readonly notificationsSubscriptionApprovalClient: notificationsSubscriptionApprovalServiceApi.SubscriptionApprovalServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileService") private readonly personalizationProfileClient: personalizationProfileServiceApi.ProfileServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("grpc:acme.secrets.v1.SecretQueryService") private readonly secretsSecretQueryClient: secretsSecretQueryServiceApi.SecretQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates an experiment.
   */
  async calculateExperiment(req: experimentsExperimentCalculationServiceApi.CalculateExperimentRequest): Promise<experimentsExperimentCalculationServiceApi.CalculateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CalculateExperiment", req);
    this.logger.info("calculate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request1 = auditAuditEventServiceApi.WatchAuditEventsRequest.fromPartial({
        context: req?.context,
        subscriber: { name: item?.contact?.name },
      });
      const stream1 = this.auditAuditEventClient.watchAuditEvents(request1, metadataFor(request1.context), { deadline: Date.now() + 15_000 });
      const messages1 = await collect(stream1);
      const reply1 = messages1.at(-1) ?? auditAuditEventServiceApi.WatchAuditEventsResponse.fromPartial({});
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? auditAuditEventServiceApi.WatchAuditEventsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return experimentsExperimentCalculationServiceApi.CalculateExperimentResponse.fromPartial({
      experiment: {
        experimentId: (req?.experimentId ?? ""),
        window: req?.experiment?.window,
      },
    });
  }

  /**
   * Compares an experiment.
   */
  async compareExperimentOptions(req: experimentsExperimentCalculationServiceApi.CompareExperimentOptionsRequest): Promise<experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "CompareExperimentOptions", req);
    this.logger.info("compare_experiment_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
    });
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.scoreRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CompareExperimentOptions.ScoreRecommendation", () => call<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse>(invoke1, request1));
    const results2 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request2 = notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest.fromPartial({
        context: req?.context,
        filter: {
          ownerId: (item?.participantId ?? ""),
          region: (req?.experiment?.location?.region ?? ""),
        },
      });
      const invoke2: Unary<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse> =
        (input, done) => this.notificationsNotificationSyncClient.listNotificationConflicts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsNotificationSyncServiceApi.ListNotificationConflictsRequest, notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse>(invoke2, request2);
      return reply2;
    }));
    const reply2 = results2.at(-1) ?? notificationsNotificationSyncServiceApi.ListNotificationConflictsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse.fromPartial({
        experiment: {
          audit: { createdBy: (reply1?.recommendation?.audit?.createdBy ?? "") },
          location: { lines: (reply1?.recommendation?.billingAddress?.lines ?? []) },
        },
      }),
      experimentsExperimentCalculationServiceApi.CompareExperimentOptionsResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }

  /**
   * Estimates an experiment.
   */
  async estimateExperiment(req: experimentsExperimentCalculationServiceApi.EstimateExperimentRequest): Promise<experimentsExperimentCalculationServiceApi.EstimateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "EstimateExperiment", req);
    this.logger.info("estimate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleQueryServiceApi.FindVehiclesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.experiment?.audit?.updatedAt,
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const invoke1: Unary<fleetVehicleQueryServiceApi.FindVehiclesRequest, fleetVehicleQueryServiceApi.FindVehiclesResponse> =
      (input, done) => this.fleetVehicleQueryClient.findVehicles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = communityForumServiceApi.WatchForumsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.details?.destination?.region ?? "") },
      subscriber: { email: (req?.experiment?.organizer?.email ?? "") },
    });
    const stream2 = this.communityForumClient.watchForums(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? communityForumServiceApi.WatchForumsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.EstimateExperimentResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      experimentsExperimentCalculationServiceApi.EstimateExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          status: req?.experiment?.status,
        },
      }),
    );
  }

  /**
   * Explains an experiment.
   */
  async explainExperimentCalculation(req: experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationRequest): Promise<experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "ExplainExperimentCalculation", req);
    this.logger.info("explain_experiment_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest.fromPartial({
      context: req?.context,
      details: { approver: { userId: (req?.experiment?.organizer?.userId ?? "") } },
      subscription: {
        audit: {
          createdAt: req?.experiment?.audit?.createdAt,
          etag: (req?.experiment?.audit?.etag ?? ""),
          updatedBy: (req?.experiment?.audit?.updatedBy ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalRequest, notificationsSubscriptionApprovalServiceApi.CommentSubscriptionApprovalResponse>(
      "acme.experiments.v1.ExperimentCalculationService/ExplainExperimentCalculation:0", request1,
    );
    const settled2 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request2 = communityPostValidationServiceApi.ValidatePostRequest.fromPartial({
        context: req?.context,
        details: { contact: { email: (item?.contact?.email ?? "") } },
      });
      const invoke2: Unary<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse> =
        (input, done) => this.communityPostValidationClient.validatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<communityPostValidationServiceApi.ValidatePostRequest, communityPostValidationServiceApi.ValidatePostResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: communityPostValidationServiceApi.ValidatePostResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? communityPostValidationServiceApi.ValidatePostResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse.fromPartial({ outcome: { message: (reply1?.outcome?.message ?? "") } }),
      experimentsExperimentCalculationServiceApi.ExplainExperimentCalculationResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          title: (req?.experiment?.title ?? ""),
        },
      }),
    );
  }

  /**
   * Returns an experiment.
   */
  async getExperimentRates(req: experimentsExperimentCalculationServiceApi.GetExperimentRatesRequest): Promise<experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse> {
    validateContext(req.context);
    if (!req.experimentId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "experiment_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetExperimentRates", req);
    this.logger.info("get_experiment_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.context?.deadline,
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
        ownerId: (req?.experimentId ?? ""),
      },
    });
    const invoke1: Unary<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.browseSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse>(invoke1, request1));
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse.fromPartial({
        result: {
          details: (reply1?.result?.details ?? {}),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      experimentsExperimentCalculationServiceApi.GetExperimentRatesResponse.fromPartial({ experiment: { experimentId: (req?.experimentId ?? "") } }),
    );
  }

  /**
   * Quotes an experiment.
   */
  async quoteExperiment(req: experimentsExperimentCalculationServiceApi.QuoteExperimentRequest): Promise<experimentsExperimentCalculationServiceApi.QuoteExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "QuoteExperiment", req);
    this.logger.info("quote_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = secretsSecretQueryServiceApi.SummarizeSecretsRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
    });
    const invoke1: Unary<secretsSecretQueryServiceApi.SummarizeSecretsRequest, secretsSecretQueryServiceApi.SummarizeSecretsResponse> =
      (input, done) => this.secretsSecretQueryClient.summarizeSecrets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<secretsSecretQueryServiceApi.SummarizeSecretsResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.QuoteExperimentResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      experimentsExperimentCalculationServiceApi.QuoteExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          window: req?.experiment?.window,
        },
      }),
    );
  }

  /**
   * Recalculates an experiment.
   */
  async recalculateExperiments(req: experimentsExperimentCalculationServiceApi.RecalculateExperimentsRequest): Promise<experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "RecalculateExperiments", req);
    this.logger.info("recalculate_experiments", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationProfileServiceApi.BatchGetProfilesRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<personalizationProfileServiceApi.BatchGetProfilesRequest, personalizationProfileServiceApi.BatchGetProfilesResponse> =
      (input, done) => this.personalizationProfileClient.batchGetProfiles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const tasks2: Array<() => Promise<personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>> = [];
    for (const item of (req?.experiment?.participants ?? [])) {
      tasks2.push(async () => {
        const request2 = personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest.fromPartial({
          context: req?.context,
          filter: {
            createdAfter: req?.experiment?.audit?.createdAt,
            labels: Object.fromEntries(Object.entries((req?.experiment?.metadata ?? {}))),
            ownerId: (item?.participantId ?? ""),
            region: (req?.details?.destination?.region ?? ""),
          },
        });
        const invoke2: Unary<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse> =
          (input, done) => this.personalizationRecommendationQueryClient.browseRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply2 = await call<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>(invoke2, request2);
        return reply2;
      });
    }
    const results2 = await Promise.all(tasks2.map((task) => task()));
    const reply2 = results2.at(-1) ?? personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      experimentsExperimentCalculationServiceApi.RecalculateExperimentsResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          organizer: req?.experiment?.organizer,
        },
      }),
    );
  }

  /**
   * Simulates an experiment.
   */
  async simulateExperiment(req: experimentsExperimentCalculationServiceApi.SimulateExperimentRequest): Promise<experimentsExperimentCalculationServiceApi.SimulateExperimentResponse> {
    validateContext(req.context);
    if (req.experiment) {
      await this.repository.save(toExperimentRecord(req.context.tenantId, req.experiment));
    }
    await this.repository.record(req.context.tenantId, "SimulateExperiment", req);
    this.logger.info("simulate_experiment", { tenant: req.context.tenantId, trace: req.context.traceId });
    const results1 = await Promise.all((req?.experiment?.participants ?? []).map(async (item) => {
      const request1 = notificationsNotificationSyncServiceApi.PushNotificationRequest.fromPartial({
        context: req?.context,
        notification: {
          requester: {
            email: (item?.contact?.email ?? ""),
            name: item?.contact?.name,
            phone: (item?.contact?.phone ?? ""),
            preferredChannel: (item?.contact?.preferredChannel ?? ""),
          },
        },
      });
      const invoke1: Unary<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse> =
        (input, done) => this.notificationsNotificationSyncClient.pushNotification(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply1 = await call<notificationsNotificationSyncServiceApi.PushNotificationRequest, notificationsNotificationSyncServiceApi.PushNotificationResponse>(invoke1, request1);
      return reply1;
    }));
    const reply1 = results1.at(-1) ?? notificationsNotificationSyncServiceApi.PushNotificationResponse.fromPartial({});
    const request2 = notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (reply1?.notification?.requester?.preferredChannel ?? ""),
        },
      },
      notificationTemplate: {
        audit: {
          createdBy: (req?.experiment?.audit?.createdBy ?? ""),
          etag: (req?.experiment?.audit?.etag ?? ""),
          updatedAt: req?.experiment?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationRequest, notificationsNotificationTemplateCalculationServiceApi.ExplainNotificationTemplateCalculationResponse> =
      (input, done) => this.notificationsNotificationTemplateCalculationClient.explainNotificationTemplateCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    const settled3 = await Promise.allSettled((req?.experiment?.participants ?? []).map(async (item) => {
      const request3 = personalizationRecommendationQueryServiceApi.FindRecommendationsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: reply1?.notification?.sla?.dueAt,
          ownerId: (item?.participantId ?? ""),
          region: (reply2?.notificationTemplate?.billingAddress?.region ?? ""),
        },
      });
      const invoke3: Unary<personalizationRecommendationQueryServiceApi.FindRecommendationsRequest, personalizationRecommendationQueryServiceApi.FindRecommendationsResponse> =
        (input, done) => this.personalizationRecommendationQueryClient.findRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply3 = await call<personalizationRecommendationQueryServiceApi.FindRecommendationsRequest, personalizationRecommendationQueryServiceApi.FindRecommendationsResponse>(invoke3, request3);
      return reply3;
    }));
    const results3: personalizationRecommendationQueryServiceApi.FindRecommendationsResponse[] = [];
    for (const result of settled3) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results3.push(result.value);
    }
    const reply3 = results3.at(-1) ?? personalizationRecommendationQueryServiceApi.FindRecommendationsResponse.fromPartial({});
    const request4 = notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest.fromPartial({
      context: req?.context,
      notificationTemplate: {
        billingAddress: { postalCode: (req?.details?.destination?.postalCode ?? "") },
        settlement: { $case: "card", card: {
          last4: ((reply2?.notificationTemplate?.settlement?.$case === "card" ? reply2?.notificationTemplate?.settlement.card : undefined)?.last4 ?? ""),
        } },
        counterparty: {
          displayName: (reply2?.notificationTemplate?.counterparty?.displayName ?? ""),
          notificationId: (reply2?.notificationTemplate?.counterparty?.notificationId ?? ""),
        },
      },
    });
    const method4 = "repairNotificationTemplate" as const;
    const invoke4: Unary<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse> =
      (input, done) => this.notificationsNotificationTemplateAdminClient[method4](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateRequest, notificationsNotificationTemplateAdminServiceApi.RepairNotificationTemplateResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      experimentsExperimentCalculationServiceApi.SimulateExperimentResponse.fromPartial({
        experiment: { audit: { updatedAt: reply2?.notificationTemplate?.audit?.updatedAt } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      experimentsExperimentCalculationServiceApi.SimulateExperimentResponse.fromPartial({
        experiment: { audit: { etag: (reply4?.notificationTemplate?.audit?.etag ?? "") } },
        result: { correlationId: (reply4?.result?.correlationId ?? "") },
      }),
      experimentsExperimentCalculationServiceApi.SimulateExperimentResponse.fromPartial({
        experiment: {
          experimentId: (req?.experimentId ?? ""),
          metadata: (req?.experiment?.metadata ?? {}),
        },
      }),
    );
  }
}
