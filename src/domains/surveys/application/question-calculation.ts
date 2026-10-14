/**
 * Computes the figures of a question, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as careplansCarePlanCalculationServiceApi from "../../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as certificatesCertificateServiceApi from "../../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as chatChatRoomCalculationServiceApi from "../../../../.cache/proto/acme/chat/v1/chat_room_calculation_service.js";
import * as communityBadgeCalculationServiceApi from "../../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as experimentsExperimentQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as experimentsVariantQueryServiceApi from "../../../../.cache/proto/acme/experiments/v1/variant_query_service.js";
import * as fleetVehicleQueryServiceApi from "../../../../.cache/proto/acme/fleet/v1/vehicle_query_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as notificationsDeliveryAttemptCalculationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_calculation_service.js";
import * as notificationsDeliveryAttemptSyncServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_sync_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import * as personalizationRecommendationQueryServiceApi from "../../../../.cache/proto/acme/personalization/v1/recommendation_query_service.js";
import * as searchSearchIndexServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../platform/context.js";
import { RpcError, requireReply } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
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
} from "../../../platform/rpc.js";
import { collect } from "../../../platform/streams.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toQuestionRecord } from "../data/records.js";
import { SurveysRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate question operations and persist audit data.
 */
@injectable()
export class QuestionCalculationWorkflow {
  constructor(
    @inject(SurveysRepository) private readonly repository: SurveysRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.careplans.v1.CarePlanCalculationService") private readonly careplansCarePlanCalculationClient: careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient,
    @inject("grpc:acme.certificates.v1.CertificateService") private readonly certificatesCertificateClient: certificatesCertificateServiceApi.CertificateServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomCalculationService") private readonly chatChatRoomCalculationClient: chatChatRoomCalculationServiceApi.ChatRoomCalculationServiceClient,
    @inject("grpc:acme.community.v1.BadgeCalculationService") private readonly communityBadgeCalculationClient: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient,
    @inject("grpc:acme.community.v1.PostValidationService") private readonly communityPostValidationClient: communityPostValidationServiceApi.PostValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentQueryService") private readonly experimentsExperimentQueryClient: experimentsExperimentQueryServiceApi.ExperimentQueryServiceClient,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.experiments.v1.VariantQueryService") private readonly experimentsVariantQueryClient: experimentsVariantQueryServiceApi.VariantQueryServiceClient,
    @inject("grpc:acme.fleet.v1.VehicleQueryService") private readonly fleetVehicleQueryClient: fleetVehicleQueryServiceApi.VehicleQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptCalculationService") private readonly notificationsDeliveryAttemptCalculationClient: notificationsDeliveryAttemptCalculationServiceApi.DeliveryAttemptCalculationServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptSyncService") private readonly notificationsDeliveryAttemptSyncClient: notificationsDeliveryAttemptSyncServiceApi.DeliveryAttemptSyncServiceClient,
    @inject("grpc:acme.notifications.v1.DeliveryAttemptValidationService") private readonly notificationsDeliveryAttemptValidationClient: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationQueryService") private readonly personalizationRecommendationQueryClient: personalizationRecommendationQueryServiceApi.RecommendationQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexService") private readonly searchSearchIndexClient: searchSearchIndexServiceApi.SearchIndexServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a question.
   */
  async calculateQuestion(req: surveysQuestionCalculationServiceApi.CalculateQuestionRequest): Promise<surveysQuestionCalculationServiceApi.CalculateQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "CalculateQuestion", req);
    this.logger.info("calculate_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.details?.destination?.lines ?? []).map((value) => value),
          recipient: (req?.details?.destination?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.calculateDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.CalculateDeliveryAttemptResponse>(invoke1, request1);
    const request2 = certificatesCertificateServiceApi.UpdateCertificateRequest.fromPartial({
      certificate: {
        lines: [{
          tax: {
            amount: (req?.question?.action?.$case === "discount" ? req?.question?.action.discount : undefined)?.amount,
          },
        }],
      },
      context: req?.context,
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<certificatesCertificateServiceApi.UpdateCertificateRequest, certificatesCertificateServiceApi.UpdateCertificateResponse> =
      (input, done) => this.certificatesCertificateClient.updateCertificate(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<certificatesCertificateServiceApi.UpdateCertificateRequest, certificatesCertificateServiceApi.UpdateCertificateResponse>(invoke2, spread2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.CalculateQuestionResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      surveysQuestionCalculationServiceApi.CalculateQuestionResponse.fromPartial({
        question: { audit: { createdAt: reply2?.certificate?.audit?.createdAt } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      surveysQuestionCalculationServiceApi.CalculateQuestionResponse.fromPartial({
        question: {
          parameters: (req?.question?.parameters ?? {}),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a question.
   */
  async compareQuestionOptions(req: surveysQuestionCalculationServiceApi.CompareQuestionOptionsRequest): Promise<surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "CompareQuestionOptions", req);
    this.logger.info("compare_question_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest.fromPartial({
      chatRoom: { audit: { updatedBy: (input1?.question?.audit?.updatedBy ?? "") } },
      context: input1?.context,
    });
    const invoke1: Unary<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse> =
      (input, done) => this.chatChatRoomCalculationClient.recalculateChatRooms(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatRoomCalculationServiceApi.RecalculateChatRoomsRequest, chatChatRoomCalculationServiceApi.RecalculateChatRoomsResponse>(invoke1, request1);
    const request2 = experimentsExperimentQueryServiceApi.ResolveExperimentsRequest.fromPartial({ context: req?.context });
    const cloned2: experimentsExperimentQueryServiceApi.ResolveExperimentsRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<experimentsExperimentQueryServiceApi.ResolveExperimentsRequest, experimentsExperimentQueryServiceApi.ResolveExperimentsResponse> =
      (input, done) => this.experimentsExperimentQueryClient.resolveExperiments(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExperimentQueryServiceApi.ResolveExperimentsRequest, experimentsExperimentQueryServiceApi.ResolveExperimentsResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse.fromPartial({ question: { name: (reply1?.chatRoom?.name ?? "") } }),
      surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse.fromPartial({ result: { referenceIds: (reply2?.result?.referenceIds ?? []) } }),
      surveysQuestionCalculationServiceApi.CompareQuestionOptionsResponse.fromPartial({
        question: {
          owner: req?.question?.owner,
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a question.
   */
  async estimateQuestion(req: surveysQuestionCalculationServiceApi.EstimateQuestionRequest): Promise<surveysQuestionCalculationServiceApi.EstimateQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "EstimateQuestion", req);
    this.logger.info("estimate_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = communityPostValidationServiceApi.NormalizePostRequest.fromPartial({
      context: req?.context,
      post: {
        audit: {
          createdAt: req?.question?.audit?.createdAt,
          createdBy: (req?.question?.audit?.createdBy ?? ""),
        },
        counterparty: { displayName: (req?.question?.owner?.displayName ?? "") },
      },
    });
    const decoded1 = communityPostValidationServiceApi.NormalizePostRequest.fromJSON(
      JSON.parse(JSON.stringify(communityPostValidationServiceApi.NormalizePostRequest.toJSON(request1))),
    );
    const invoke1: Unary<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse> =
      (input, done) => this.communityPostValidationClient.normalizePost(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<communityPostValidationServiceApi.NormalizePostRequest, communityPostValidationServiceApi.NormalizePostResponse>(invoke1, decoded1);
    const request2 = personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.post?.issuedAt,
        region: (reply1?.post?.billingAddress?.region ?? ""),
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.personalization.v1.BrowseRecommendationsRequest",
      value: Buffer.from(personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest.encode(request2).finish()),
    });
    const unpacked2 = personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest.decode(envelope2.value);
    const invoke2: Unary<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse> =
      (input, done) => this.personalizationRecommendationQueryClient.browseRecommendations(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationQueryServiceApi.BrowseRecommendationsRequest, personalizationRecommendationQueryServiceApi.BrowseRecommendationsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.EstimateQuestionResponse.fromPartial({
        question: {
          audit: {
            createdAt: reply1?.post?.audit?.createdAt,
            createdBy: (reply1?.post?.audit?.createdBy ?? ""),
          },
        },
      }),
      surveysQuestionCalculationServiceApi.EstimateQuestionResponse.fromPartial({
        result: {
          referenceIds: (reply2?.result?.referenceIds ?? []),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      surveysQuestionCalculationServiceApi.EstimateQuestionResponse.fromPartial({
        question: {
          questionId: (req?.questionId ?? ""),
          version: (req?.question?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Explains a question.
   */
  async explainQuestionCalculation(req: surveysQuestionCalculationServiceApi.ExplainQuestionCalculationRequest): Promise<surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "ExplainQuestionCalculation", req);
    this.logger.info("explain_question_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = fleetVehicleQueryServiceApi.FindVehiclesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        labels: Object.fromEntries(Object.entries((req?.question?.parameters ?? {}))),
        ownerId: (req?.question?.owner?.userId ?? ""),
      },
    });
    const client1 = this.clients.get<fleetVehicleQueryServiceApi.VehicleQueryServiceClient>("acme.fleet.v1.VehicleQueryService");
    const invoke1: Unary<fleetVehicleQueryServiceApi.FindVehiclesRequest, fleetVehicleQueryServiceApi.FindVehiclesResponse> =
      (input, done) => client1.findVehicles(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<fleetVehicleQueryServiceApi.FindVehiclesRequest, fleetVehicleQueryServiceApi.FindVehiclesResponse>(invoke1, request1);
    const request2 = experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.details?.contact?.phone ?? "") } },
      exposure: {
        correlationId: (reply1?.result?.correlationId ?? ""),
        subject: { displayName: (req?.question?.owner?.displayName ?? "") },
      },
      reason: ((req?.question?.action?.$case === "block" ? req?.question?.action.block : undefined)?.reason ?? ""),
    });
    const invoke2: Unary<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse> =
      (input, done) => this.experimentsExposureValidationClient.checkExposureEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<experimentsExposureValidationServiceApi.CheckExposureEligibilityRequest, experimentsExposureValidationServiceApi.CheckExposureEligibilityResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse.fromPartial({
        result: {
          correlationId: (reply2?.exposure?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
      surveysQuestionCalculationServiceApi.ExplainQuestionCalculationResponse.fromPartial({
        question: {
          questionId: (req?.questionId ?? ""),
          version: (req?.question?.version ?? 0),
        },
      }),
    );
  }

  /**
   * Returns a question.
   */
  async getQuestionRates(req: surveysQuestionCalculationServiceApi.GetQuestionRatesRequest): Promise<surveysQuestionCalculationServiceApi.GetQuestionRatesResponse> {
    validateContext(req.context);
    if (!req.questionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "question_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetQuestionRates", req);
    this.logger.info("get_question_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexServiceApi.UpdateSearchIndexRequest.fromPartial({
      context: req?.context,
      searchIndex: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<searchSearchIndexServiceApi.UpdateSearchIndexRequest, searchSearchIndexServiceApi.UpdateSearchIndexResponse> =
      (input, done) => this.searchSearchIndexClient.updateSearchIndex(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<searchSearchIndexServiceApi.UpdateSearchIndexRequest, searchSearchIndexServiceApi.UpdateSearchIndexResponse>(invoke1, request1));
    const request2 = careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsRequest.fromPartial({
      carePlan: {
        audit: {
          createdAt: reply1?.searchIndex?.audit?.createdAt,
          createdBy: (reply1?.searchIndex?.audit?.createdBy ?? ""),
          updatedBy: (reply1?.searchIndex?.audit?.updatedBy ?? ""),
        },
        lines: [{
          quantity: (reply1?.searchIndex?.components?.["primary"]?.quantity ?? 0),
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsRequest, careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsResponse> =
      (input, done) => this.careplansCarePlanCalculationClient.compareCarePlanOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("GetQuestionRates.CompareCarePlanOptions", () => call<careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsRequest, careplansCarePlanCalculationServiceApi.CompareCarePlanOptionsResponse>(invoke2, request2));
    return mergeResponses(
      surveysQuestionCalculationServiceApi.GetQuestionRatesResponse.fromPartial({
        question: {
          audit: { updatedBy: (reply1?.searchIndex?.audit?.updatedBy ?? "") },
          owner: { displayName: (reply1?.searchIndex?.owner?.displayName ?? "") },
        },
      }),
      surveysQuestionCalculationServiceApi.GetQuestionRatesResponse.fromPartial({
        question: { audit: { updatedAt: reply2?.carePlan?.audit?.updatedAt } },
      }),
      surveysQuestionCalculationServiceApi.GetQuestionRatesResponse.fromPartial({ question: { questionId: (req?.questionId ?? "") } }),
    );
  }

  /**
   * Quotes a question.
   */
  async quoteQuestion(req: surveysQuestionCalculationServiceApi.QuoteQuestionRequest): Promise<surveysQuestionCalculationServiceApi.QuoteQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "QuoteQuestion", req);
    this.logger.info("quote_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.question?.owner?.displayName ?? "") } },
      details: { contact: { email: (req?.question?.owner?.email ?? "") } },
      reason: ((req?.question?.action?.$case === "block" ? req?.question?.action.block : undefined)?.reason ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptValidationClient.previewDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = communityBadgeCalculationServiceApi.CalculateBadgeRequest.fromPartial({
      badge: { owner: { email: (req?.question?.owner?.email ?? "") } },
      context: req?.context,
    });
    const reply2 = await this.workQueue.enqueue<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(
      "acme.surveys.v1.QuestionCalculationService/QuoteQuestion:1", request2,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.QuoteQuestionResponse.fromPartial({ result: { message: (reply1?.outcome?.message ?? "") } }),
      surveysQuestionCalculationServiceApi.QuoteQuestionResponse.fromPartial({ result: { message: (reply2?.result?.message ?? "") } }),
      surveysQuestionCalculationServiceApi.QuoteQuestionResponse.fromPartial({
        question: {
          parameters: (req?.question?.parameters ?? {}),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Recalculates a question.
   */
  async recalculateQuestions(req: surveysQuestionCalculationServiceApi.RecalculateQuestionsRequest): Promise<surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "RecalculateQuestions", req);
    this.logger.info("recalculate_questions", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_2: string | undefined;
    switch (req?.question?.action?.$case) {
      case "block":
        selected1_2 = ((req?.question?.action?.$case === "block" ? req?.question?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected1_2 = "";
    }
    const request1 = notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest.fromPartial({
      context: req?.context,
      deliveryAttempt: { subject: { displayName: (req?.question?.owner?.displayName ?? "") } },
      reason: (selected1_2 ?? ""),
    });
    const invoke1: Unary<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse> =
      (input, done) => this.notificationsDeliveryAttemptSyncClient.syncDeliveryAttempts(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsRequest, notificationsDeliveryAttemptSyncServiceApi.SyncDeliveryAttemptsResponse>(invoke1, request1);
    const request2 = experimentsVariantQueryServiceApi.ExportVariantsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.question?.audit?.createdAt,
        ownerId: (reply1?.deliveryAttempt?.deliveryAttemptId ?? ""),
        region: (req?.details?.destination?.region ?? ""),
      },
    });
    const stream2 = this.experimentsVariantQueryClient.exportVariants(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? experimentsVariantQueryServiceApi.ExportVariantsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      surveysQuestionCalculationServiceApi.RecalculateQuestionsResponse.fromPartial({
        question: {
          priority: (req?.question?.priority ?? 0),
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a question.
   */
  async simulateQuestion(req: surveysQuestionCalculationServiceApi.SimulateQuestionRequest): Promise<surveysQuestionCalculationServiceApi.SimulateQuestionResponse> {
    validateContext(req.context);
    if (req.question) {
      await this.repository.save(toQuestionRecord(req.context.tenantId, req.question));
    }
    await this.repository.record(req.context.tenantId, "SimulateQuestion", req);
    this.logger.info("simulate_question", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserValidationServiceApi.GetUserRulesRequest.fromPartial({
      context: req?.context,
      userId: (req?.question?.owner?.userId ?? ""),
    });
    const invoke1: Unary<identityUserValidationServiceApi.GetUserRulesRequest, identityUserValidationServiceApi.GetUserRulesResponse> =
      (input, done) => this.identityUserValidationClient.getUserRules(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await new Promise<identityUserValidationServiceApi.GetUserRulesResponse>((resolve, reject) => {
      invoke1(request1, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request2 = chatChatRoomCalculationServiceApi.CalculateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: { region: (reply1?.user?.primaryAddress?.region ?? "") } },
      },
      context: req?.context,
      details: { destination: { region: (req?.details?.destination?.region ?? "") } },
    });
    const invoke2: Unary<chatChatRoomCalculationServiceApi.CalculateChatRoomRequest, chatChatRoomCalculationServiceApi.CalculateChatRoomResponse> =
      (input, done) => this.chatChatRoomCalculationClient.calculateChatRoom(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send2 = promised(invoke2);
    const reply2 = await send2(request2);
    const request3 = notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const invoke3: Unary<notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptRequest, notificationsDeliveryAttemptCalculationServiceApi.QuoteDeliveryAttemptResponse> =
      (input, done) => this.notificationsDeliveryAttemptCalculationClient.quoteDeliveryAttempt(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke3 = promisify(invoke3);
    const reply3 = requireReply(await asyncInvoke3(request3));
    const request4 = ledgerLedgerAccountServiceApi.WatchLedgerAccountsRequest.fromPartial({
      context: req?.context,
      filter: { region: (reply1?.user?.primaryAddress?.region ?? "") },
    });
    const stream4 = this.ledgerLedgerAccountClient.watchLedgerAccounts(request4, metadataFor(request4.context), { deadline: Date.now() + 15_000 });
    const messages4 = await collect(stream4);
    const reply4 = messages4.at(-1) ?? ledgerLedgerAccountServiceApi.WatchLedgerAccountsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      surveysQuestionCalculationServiceApi.SimulateQuestionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      surveysQuestionCalculationServiceApi.SimulateQuestionResponse.fromPartial({
        question: {
          audit: {
            etag: (reply2?.chatRoom?.audit?.etag ?? ""),
            updatedBy: (reply2?.chatRoom?.audit?.updatedBy ?? ""),
          },
        },
      }),
      surveysQuestionCalculationServiceApi.SimulateQuestionResponse.fromPartial({ result: { referenceIds: (reply3?.result?.referenceIds ?? []) } }),
      surveysQuestionCalculationServiceApi.SimulateQuestionResponse.fromPartial({
        question: {
          effective: req?.question?.effective,
          questionId: (req?.questionId ?? ""),
        },
      }),
    );
  }
}
