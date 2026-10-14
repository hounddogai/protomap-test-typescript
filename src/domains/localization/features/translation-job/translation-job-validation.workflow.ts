/**
 * Checks translation jobs against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as commonMoneyApi from "../../../../../.cache/proto/acme/common/v1/money.js";
import * as communityPostCalculationServiceApi from "../../../../../.cache/proto/acme/community/v1/post_calculation_service.js";
import * as experimentsVariantValidationServiceApi from "../../../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationLocaleValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_validation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as notificationsDeliveryAttemptWorkflowServiceApi from "../../../../../.cache/proto/acme/notifications/v1/delivery_attempt_workflow_service.js";
import * as notificationsSubscriptionCalculationServiceApi from "../../../../../.cache/proto/acme/notifications/v1/subscription_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTranslationJobRecord } from "../../data/records.js";
import { LocalizationRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation job operations and persist audit data.
 */
@injectable()
export class TranslationJobValidationWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.community.v1.PostCalculationService") private readonly communityPostCalculationClient: communityPostCalculationServiceApi.PostCalculationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantValidationService") private readonly experimentsVariantValidationClient: experimentsVariantValidationServiceApi.VariantValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleValidationService") private readonly localizationLocaleValidationClient: localizationLocaleValidationServiceApi.LocaleValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptWorkflowService") private readonly notificationsDeliveryAttemptWorkflowClient: notificationsDeliveryAttemptWorkflowServiceApi.DeliveryAttemptWorkflowServiceClient,
    @inject("grpc:acme.notifications.v1.SubscriptionCalculationService") private readonly notificationsSubscriptionCalculationClient: notificationsSubscriptionCalculationServiceApi.SubscriptionCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexValidationService") private readonly searchSearchIndexValidationClient: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Explains a translation job.
   */
  async explainTranslationJobDecision(req: localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest): Promise<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ExplainTranslationJobDecision", req);
    this.logger.info("explain_translation_job_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest.fromPartial({
      context: req?.context,
      translationJob: {
        origin: { $case: "customer", customer: { email: (req?.translationJob?.assignee?.email ?? "") } },
      },
    });
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.explainTranslationJobCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("ExplainTranslationJobDecision.ExplainTranslationJobCalculation", () => call<localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationRequest, localizationTranslationJobCalculationServiceApi.ExplainTranslationJobCalculationResponse>(invoke1, request1));
    const request2 = localizationLocaleCalculationServiceApi.CalculateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          etag: (reply1?.translationJob?.audit?.etag ?? ""),
          updatedAt: reply1?.translationJob?.audit?.updatedAt,
        },
      },
    });
    const invoke2: Unary<localizationLocaleCalculationServiceApi.CalculateLocaleRequest, localizationLocaleCalculationServiceApi.CalculateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.calculateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task2 = operation(invoke2)(request2);
    const reply2 = await task2();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse.fromPartial({
        translationJob: { sla: { dueAt: reply1?.translationJob?.sla?.dueAt } },
      }),
      localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse.fromPartial({
        translationJob: { audit: { etag: (reply2?.locale?.audit?.etag ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse.fromPartial({
        translationJob: {
          subject: (req?.translationJob?.subject ?? ""),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a translation job.
   */
  async getTranslationJobRules(req: localizationTranslationJobValidationServiceApi.GetTranslationJobRulesRequest): Promise<localizationTranslationJobValidationServiceApi.GetTranslationJobRulesResponse> {
    validateContext(req.context);
    if (!req.translationJobId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_job_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTranslationJobRules", req);
    this.logger.info("get_translation_job_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.fromPartial({
      context: req?.context,
      translationKey: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const reply1 = await this.workQueue.enqueue<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>(
      "acme.localization.v1.TranslationJobValidationService/GetTranslationJobRules:0", request1,
    );
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.GetTranslationJobRulesResponse.fromPartial({
        translationJob: { audit: { updatedAt: reply1?.translationKey?.audit?.updatedAt } },
      }),
      localizationTranslationJobValidationServiceApi.GetTranslationJobRulesResponse.fromPartial({ translationJob: { translationJobId: (req?.translationJobId ?? "") } }),
    );
  }

  /**
   * Lints a translation job.
   */
  async lintTranslationJobs(req: localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest): Promise<localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "LintTranslationJobs", req);
    this.logger.info("lint_translation_jobs", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.translationJob?.requester?.preferredChannel ?? ""),
        },
      },
      translationKey: {
        owner: {
          email: (req?.details?.contact?.email ?? ""),
          userId: (req?.translationJob?.assignee?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse> =
      (input, done) => this.localizationTranslationKeyValidationClient.explainTranslationKeyDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse>(invoke1, request1));
    const settled2 = await Promise.allSettled((req?.translationJob?.history ?? []).map(async (item) => {
      const request2 = notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest.fromPartial({
        context: req?.context,
        filter: {
          createdAfter: item?.changedAt,
          labels: Object.fromEntries(Object.entries((req?.translationJob?.customFields ?? {}))),
          ownerId: (req?.translationJob?.assignee?.userId ?? ""),
          region: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.region ?? ""),
        },
      });
      const invoke2: Unary<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse> =
        (input, done) => this.notificationsDeliveryAttemptWorkflowClient.listDeliveryAttemptWorkflows(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
      const reply2 = await call<notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsRequest, notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse>(invoke2, request2);
      return reply2;
    }));
    const results2: notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse[] = [];
    for (const result of settled2) {
      if (result.status === "rejected") throw serviceError(result.reason);
      results2.push(result.value);
    }
    const reply2 = results2.at(-1) ?? notificationsDeliveryAttemptWorkflowServiceApi.ListDeliveryAttemptWorkflowsResponse.fromPartial({});
    const request3 = localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          recipient: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.recipient ?? ""),
        },
      },
      translationKey: {
        locator: { $case: "address", address: {
          postalCode: ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.postalCode ?? ""),
        } },
        audit: { updatedBy: (req?.translationJob?.audit?.updatedBy ?? "") },
        owner: {
          email: ((req?.translationJob?.origin?.$case === "customer" ? req?.translationJob?.origin.customer : undefined)?.email ?? ""),
        },
      },
    });
    const invoke3: Unary<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysRequest, localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.recalculateTranslationKeys(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<localizationTranslationKeyCalculationServiceApi.RecalculateTranslationKeysResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse.fromPartial({
        outcome: { referenceId: (reply1?.outcome?.referenceId ?? "") },
        translationJob: { assignee: { userId: (reply1?.translationKey?.owner?.userId ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse.fromPartial({
        result: { message: (reply3?.result?.message ?? "") },
        translationJob: { assignee: { userId: (reply3?.translationKey?.owner?.userId ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse.fromPartial({
        translationJob: {
          subject: (req?.translationJob?.subject ?? ""),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Normalizes a translation job.
   */
  async normalizeTranslationJob(req: localizationTranslationJobValidationServiceApi.NormalizeTranslationJobRequest): Promise<localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "NormalizeTranslationJob", req);
    this.logger.info("normalize_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.details?.contact?.email ?? "") } },
    });
    const invoke1: Unary<experimentsVariantValidationServiceApi.CheckVariantEligibilityRequest, experimentsVariantValidationServiceApi.CheckVariantEligibilityResponse> =
      (input, done) => this.experimentsVariantValidationClient.checkVariantEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    const request2 = notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest.fromPartial({
      context: req?.context,
      subscription: {
        audit: {
          createdAt: reply1?.variant?.audit?.createdAt,
          createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          updatedAt: req?.translationJob?.audit?.updatedAt,
        },
        owner: { displayName: (reply1?.variant?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionRequest, notificationsSubscriptionCalculationServiceApi.CalculateSubscriptionResponse> =
      (input, done) => this.notificationsSubscriptionCalculationClient.calculateSubscription(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke2 = promisify(invoke2);
    const reply2 = requireReply(await asyncInvoke2(request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse.fromPartial({
        translationJob: { audit: { etag: (reply1?.variant?.audit?.etag ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse.fromPartial({
        translationJob: { audit: { updatedAt: reply2?.subscription?.audit?.updatedAt } },
      }),
      localizationTranslationJobValidationServiceApi.NormalizeTranslationJobResponse.fromPartial({
        translationJob: {
          requester: req?.translationJob?.requester,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Previews a translation job.
   */
  async previewTranslationJob(req: localizationTranslationJobValidationServiceApi.PreviewTranslationJobRequest): Promise<localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "PreviewTranslationJob", req);
    this.logger.info("preview_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleValidationServiceApi.NormalizeLocaleRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      locale: {
        audit: {
          createdBy: (req?.translationJob?.audit?.createdBy ?? ""),
          etag: (req?.translationJob?.audit?.etag ?? ""),
        },
        owner: { email: (req?.translationJob?.assignee?.email ?? "") },
      },
    });
    const method1 = "normalizeLocale" as const;
    const invoke1: Unary<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse> =
      (input, done) => this.localizationLocaleValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleValidationServiceApi.NormalizeLocaleRequest, localizationLocaleValidationServiceApi.NormalizeLocaleResponse>(invoke1, request1);
    const request2 = searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.details?.contact?.name,
          phone: (req?.translationJob?.requester?.phone ?? ""),
        },
      },
      searchIndex: { audit: { updatedAt: reply1?.locale?.audit?.updatedAt } },
    });
    const proxy2 = forwarding(this.searchSearchIndexValidationClient);
    const invoke2: Unary<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse> =
      (input, done) => proxy2.normalizeSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<searchSearchIndexValidationServiceApi.NormalizeSearchIndexRequest, searchSearchIndexValidationServiceApi.NormalizeSearchIndexResponse>(invoke2, request2);
    let selected3_1: commonMoneyApi.Money | undefined;
    switch (reply1?.locale?.action?.$case) {
      case "discount":
        selected3_1 = (reply1?.locale?.action?.$case === "discount" ? reply1?.locale?.action.discount : undefined)?.amount;
        break;
      default:
        selected3_1 = undefined;
    }
    const request3 = communityPostCalculationServiceApi.SimulatePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          etag: (reply1?.locale?.audit?.etag ?? ""),
          updatedAt: reply1?.locale?.audit?.updatedAt,
        },
        counterparty: { displayName: (req?.translationJob?.assignee?.displayName ?? "") },
        lines: [{ amount: selected3_1 }],
      },
    });
    const invoke3: Unary<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse> =
      (input, done) => this.communityPostCalculationClient.simulatePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<communityPostCalculationServiceApi.SimulatePostRequest, communityPostCalculationServiceApi.SimulatePostResponse>(invoke3, request3);
    const tasks4: Array<() => Promise<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>> = [];
    for (const item of (req?.translationJob?.comments ?? [])) {
      tasks4.push(async () => {
        const request4 = notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest.fromPartial({
          context: req?.context,
          deliveryAttempt: {
            measurements: [{ unit: (reply2?.searchIndex?.dimensions?.unit ?? "") }],
            subject: { displayName: (req?.translationJob?.assignee?.displayName ?? "") },
          },
          details: {
            notify: {
              email: (item?.authorEmail ?? ""),
              name: req?.details?.contact?.name,
            },
          },
        });
        const invoke4: Unary<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse> =
          (input, done) => this.notificationsDeliveryAttemptWorkflowClient.pauseDeliveryAttemptWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
        const reply4 = await call<notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowRequest, notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse>(invoke4, request4);
        return reply4;
      });
    }
    const results4 = await Promise.all(tasks4.map((task) => task()));
    const reply4 = results4.at(-1) ?? notificationsDeliveryAttemptWorkflowServiceApi.PauseDeliveryAttemptWorkflowResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { userId: (reply1?.locale?.owner?.userId ?? "") },
          audit: { updatedAt: reply1?.locale?.audit?.updatedAt },
        },
      }),
      localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse.fromPartial({
        translationJob: { audit: { createdAt: reply2?.searchIndex?.audit?.createdAt } },
      }),
      localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse.fromPartial({
        translationJob: { audit: { createdBy: (reply3?.post?.audit?.createdBy ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.PreviewTranslationJobResponse.fromPartial({
        translationJob: {
          customFields: (req?.translationJob?.customFields ?? {}),
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Scores a translation job.
   */
  async scoreTranslationJob(req: localizationTranslationJobValidationServiceApi.ScoreTranslationJobRequest): Promise<localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ScoreTranslationJob", req);
    this.logger.info("score_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.details?.destination?.locality ?? "") },
      },
      recommendation: {
        audit: { etag: (req?.translationJob?.audit?.etag ?? "") },
        billingAddress: { postalCode: (req?.details?.destination?.postalCode ?? "") },
        counterparty: { displayName: (req?.translationJob?.assignee?.displayName ?? "") },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.calculateRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationCalculationServiceApi.CalculateRecommendationRequest, personalizationRecommendationCalculationServiceApi.CalculateRecommendationResponse>(invoke1, spread1);
    const { context: context2, ...body2 } = req;
    const input2 = { ...body2, context: context2 };
    const request2 = localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.fromPartial({
      context: input2?.context,
      translationJob: {
        origin: { $case: "customer", customer: {
          displayName: ((input2?.translationJob?.origin?.$case === "customer" ? input2?.translationJob?.origin.customer : undefined)?.displayName ?? ""),
          email: (input2?.translationJob?.requester?.email ?? ""),
        } },
      },
    });
    const invoke2: Unary<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.quoteTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse>(invoke2, request2);
    const request3 = experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.translationJob?.requester?.preferredChannel ?? ""),
        },
      },
      variant: { owner: { email: (reply2?.translationJob?.assignee?.email ?? "") } },
    });
    const cloned3: experimentsVariantValidationServiceApi.NormalizeVariantRequest = JSON.parse(JSON.stringify(request3));
    const invoke3: Unary<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.normalizeVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>(invoke3, cloned3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { email: (reply1?.recommendation?.counterparty?.email ?? "") },
        },
      }),
      localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse.fromPartial({
        translationJob: { audit: { etag: (reply2?.translationJob?.audit?.etag ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse.fromPartial({
        translationJob: {
          assignee: { userId: (reply3?.variant?.owner?.userId ?? "") },
          audit: { updatedBy: (reply3?.variant?.audit?.updatedBy ?? "") },
        },
      }),
      localizationTranslationJobValidationServiceApi.ScoreTranslationJobResponse.fromPartial({
        translationJob: {
          status: req?.translationJob?.status,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }

  /**
   * Validates a translation job.
   */
  async validateTranslationJob(req: localizationTranslationJobValidationServiceApi.ValidateTranslationJobRequest): Promise<localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse> {
    validateContext(req.context);
    if (req.translationJob) {
      await this.repository.save(toTranslationJobRecord(req.context.tenantId, req.translationJob));
    }
    await this.repository.record(req.context.tenantId, "ValidateTranslationJob", req);
    this.logger.info("validate_translation_job", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsVariantValidationServiceApi.ValidateVariantRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: req?.translationJob?.requester?.name,
          preferredChannel: (req?.details?.contact?.preferredChannel ?? ""),
        },
      },
      variant: {
        audit: { etag: (req?.translationJob?.audit?.etag ?? "") },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
    });
    const decoded1 = experimentsVariantValidationServiceApi.ValidateVariantRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsVariantValidationServiceApi.ValidateVariantRequest.toJSON(request1))),
    );
    const invoke1: Unary<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse> =
      (input, done) => this.experimentsVariantValidationClient.validateVariant(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<experimentsVariantValidationServiceApi.ValidateVariantRequest, experimentsVariantValidationServiceApi.ValidateVariantResponse>(invoke1, decoded1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse.fromPartial({
        outcome: { status: (reply1?.outcome?.status ?? "") },
        translationJob: { audit: { etag: (reply1?.variant?.audit?.etag ?? "") } },
      }),
      localizationTranslationJobValidationServiceApi.ValidateTranslationJobResponse.fromPartial({
        translationJob: {
          status: req?.translationJob?.status,
          translationJobId: (req?.translationJobId ?? ""),
        },
      }),
    );
  }
}
