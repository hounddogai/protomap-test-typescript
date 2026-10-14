/**
 * Computes the figures of a rendition, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as appointmentsAppointmentServiceApi from "../../../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as certificatesCertificateServiceApi from "../../../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as chatChatBotValidationServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as chatChatRoomServiceApi from "../../../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as mediaMediaAssetCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/media_asset_calculation_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as personalizationRecommendationCalculationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_calculation_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as telehealthVideoVisitCalculationServiceApi from "../../../../../.cache/proto/acme/telehealth/v1/video_visit_calculation_service.js";
import * as googleAnyApi from "../../../../../.cache/proto/google/protobuf/any.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, operation, promised, type Unary, workflow } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toRenditionRecord } from "../../data/records.js";
import { MediaRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate rendition operations and persist audit data.
 */
@injectable()
export class RenditionCalculationWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.appointments.v1.AppointmentService") private readonly appointmentsAppointmentClient: appointmentsAppointmentServiceApi.AppointmentServiceClient,
    @inject("grpc:acme.certificates.v1.CertificateService") private readonly certificatesCertificateClient: certificatesCertificateServiceApi.CertificateServiceClient,
    @inject("grpc:acme.chat.v1.ChatBotValidationService") private readonly chatChatBotValidationClient: chatChatBotValidationServiceApi.ChatBotValidationServiceClient,
    @inject("grpc:acme.chat.v1.ChatRoomService") private readonly chatChatRoomClient: chatChatRoomServiceApi.ChatRoomServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldCalculationService") private readonly formsFormFieldCalculationClient: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetCalculationService") private readonly mediaMediaAssetCalculationClient: mediaMediaAssetCalculationServiceApi.MediaAssetCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationCalculationService") private readonly personalizationRecommendationCalculationClient: personalizationRecommendationCalculationServiceApi.RecommendationCalculationServiceClient,
    @inject("grpc:acme.personalization.v1.RecommendationValidationService") private readonly personalizationRecommendationValidationClient: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient,
    @inject("grpc:acme.telehealth.v1.VideoVisitCalculationService") private readonly telehealthVideoVisitCalculationClient: telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a rendition.
   */
  async calculateRendition(req: mediaRenditionCalculationServiceApi.CalculateRenditionRequest): Promise<mediaRenditionCalculationServiceApi.CalculateRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "CalculateRendition", req);
    this.logger.info("calculate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        components: { primary: {
          description: (req?.rendition?.components?.["primary"]?.description ?? ""),
        } },
        dimensions: { unit: (req?.rendition?.dimensions?.unit ?? "") },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await workflow("CalculateRendition.QuoteMediaAsset", () => call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke1, request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.CalculateRenditionResponse.fromPartial({
        rendition: { audit: { updatedBy: (reply1?.mediaAsset?.audit?.updatedBy ?? "") } },
      }),
      mediaRenditionCalculationServiceApi.CalculateRenditionResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a rendition.
   */
  async compareRenditionOptions(req: mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest): Promise<mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "CompareRenditionOptions", req);
    this.logger.info("compare_rendition_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { lines: (req?.details?.destination?.lines ?? []).map((value) => value) },
      },
      videoVisit: { audit: { createdAt: req?.rendition?.audit?.createdAt } },
    });
    const invoke1: Unary<telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest, telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitResponse> =
      (input, done) => this.telehealthVideoVisitCalculationClient.calculateVideoVisit(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    const request2 = certificatesCertificateServiceApi.WatchCertificatesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: reply1?.videoVisit?.audit?.createdAt,
        region: (req?.details?.destination?.region ?? ""),
      },
      subscriber: { email: (reply1?.videoVisit?.organizer?.email ?? "") },
    });
    const stream2 = this.certificatesCertificateClient.watchCertificates(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? certificatesCertificateServiceApi.WatchCertificatesResponse.fromPartial({});
    const request3 = chatChatRoomServiceApi.UpdateChatRoomRequest.fromPartial({
      chatRoom: {
        locator: { $case: "address", address: {
          lines: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.lines ?? []).map((value) => value),
        } },
        dimensions: { unit: (req?.rendition?.dimensions?.unit ?? "") },
      },
      context: req?.context,
    });
    const reply3 = await this.workQueue.enqueue<chatChatRoomServiceApi.UpdateChatRoomRequest, chatChatRoomServiceApi.UpdateChatRoomResponse>(
      "acme.media.v1.RenditionCalculationService/CompareRenditionOptions:2", request3,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse.fromPartial({
        rendition: {
          capacity: (reply3?.chatRoom?.capacity ?? 0),
          components: { primary: { quantity: (reply3?.chatRoom?.components?.["primary"]?.quantity ?? 0) } },
        },
      }),
      mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Estimates a rendition.
   */
  async estimateRendition(req: mediaRenditionCalculationServiceApi.EstimateRenditionRequest): Promise<mediaRenditionCalculationServiceApi.EstimateRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "EstimateRendition", req);
    this.logger.info("estimate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_1 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_2 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: string | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_3 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? "");
        break;
      default:
        selected1_3 = "";
    }
    let selected1_4: Array<string> | undefined;
    switch (req?.rendition?.locator?.$case) {
      case "address":
        selected1_4 = ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected1_4 = [];
    }
    const request1 = personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest.fromPartial({
      context: req?.context,
      details: { destination: { lines: (selected1_4 ?? []) } },
      recommendation: {
        billingAddress: {
          countryCode: (selected1_3 ?? ""),
          postalCode: (selected1_2 ?? ""),
          region: (selected1_1 ?? ""),
        },
      },
    });
    const invoke1: Unary<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse> =
      (input, done) => this.personalizationRecommendationValidationClient.scoreRecommendation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationRecommendationValidationServiceApi.ScoreRecommendationRequest, personalizationRecommendationValidationServiceApi.ScoreRecommendationResponse>(invoke1, request1);
    const request2 = mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.countryCode ?? ""),
          locality: (req?.details?.destination?.locality ?? ""),
        },
      },
      mediaAsset: {
        audit: { createdAt: req?.rendition?.audit?.createdAt },
        dimensions: { weight: (req?.rendition?.dimensions?.weight ?? 0) },
      },
    });
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.estimateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<mediaMediaAssetCalculationServiceApi.EstimateMediaAssetResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request3 = mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          postalCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.postalCode ?? ""),
        } },
      },
    });
    const invoke3: Unary<mediaMediaAssetCalculationServiceApi.CalculateMediaAssetRequest, mediaMediaAssetCalculationServiceApi.CalculateMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.calculateMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send3 = promised(invoke3);
    const reply3 = await send3(request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.EstimateRenditionResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } }),
      mediaRenditionCalculationServiceApi.EstimateRenditionResponse.fromPartial({
        rendition: {
          components: { primary: {
            description: (reply2?.mediaAsset?.components?.["primary"]?.description ?? ""),
          } },
          owner: { email: (reply2?.mediaAsset?.owner?.email ?? "") },
        },
      }),
      mediaRenditionCalculationServiceApi.EstimateRenditionResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          message: (reply3?.result?.message ?? ""),
        },
      }),
      mediaRenditionCalculationServiceApi.EstimateRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a rendition.
   */
  async explainRenditionCalculation(req: mediaRenditionCalculationServiceApi.ExplainRenditionCalculationRequest): Promise<mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "ExplainRenditionCalculation", req);
    this.logger.info("explain_rendition_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        components: { primary: { quantity: (req?.rendition?.components?.["primary"]?.quantity ?? 0) } },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.recalculateMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = appointmentsAppointmentServiceApi.UpdateAppointmentRequest.fromPartial({
      appointment: {
        participants: [{
          contact: {
            email: (req?.rendition?.owner?.email ?? ""),
            name: req?.details?.contact?.name,
          },
        }],
      },
      context: req?.context,
    });
    const method2 = "updateAppointment" as const;
    const invoke2: Unary<appointmentsAppointmentServiceApi.UpdateAppointmentRequest, appointmentsAppointmentServiceApi.UpdateAppointmentResponse> =
      (input, done) => this.appointmentsAppointmentClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<appointmentsAppointmentServiceApi.UpdateAppointmentRequest, appointmentsAppointmentServiceApi.UpdateAppointmentResponse>(invoke2, request2);
    const request3 = formsFormFieldCalculationServiceApi.CalculateFormFieldRequest.fromPartial({
      context: req?.context,
      formField: { audit: { updatedAt: reply2?.appointment?.audit?.updatedAt } },
    });
    const proxy3 = forwarding(this.formsFormFieldCalculationClient);
    const invoke3: Unary<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse> =
      (input, done) => proxy3.calculateFormField(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<formsFormFieldCalculationServiceApi.CalculateFormFieldRequest, formsFormFieldCalculationServiceApi.CalculateFormFieldResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse.fromPartial({
        rendition: {
          code: (reply1?.mediaAsset?.code ?? ""),
          dimensions: { unit: (reply1?.mediaAsset?.dimensions?.unit ?? "") },
        },
      }),
      mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse.fromPartial({
        rendition: { audit: { updatedBy: (reply2?.appointment?.audit?.updatedBy ?? "") } },
        result: { referenceIds: (reply2?.result?.referenceIds ?? []) },
      }),
      mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse.fromPartial({ rendition: { owner: reply3?.formField?.owner } }),
      mediaRenditionCalculationServiceApi.ExplainRenditionCalculationResponse.fromPartial({
        rendition: {
          renditionId: (req?.renditionId ?? ""),
          specs: (req?.rendition?.specs ?? {}),
        },
      }),
    );
  }

  /**
   * Returns a rendition.
   */
  async getRenditionRates(req: mediaRenditionCalculationServiceApi.GetRenditionRatesRequest): Promise<mediaRenditionCalculationServiceApi.GetRenditionRatesResponse> {
    validateContext(req.context);
    if (!req.renditionId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "rendition_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetRenditionRates", req);
    this.logger.info("get_rendition_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = chatChatBotValidationServiceApi.PreviewChatBotRequest.fromPartial({
      chatBot: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke1: Unary<chatChatBotValidationServiceApi.PreviewChatBotRequest, chatChatBotValidationServiceApi.PreviewChatBotResponse> =
      (input, done) => this.chatChatBotValidationClient.previewChatBot(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<chatChatBotValidationServiceApi.PreviewChatBotRequest, chatChatBotValidationServiceApi.PreviewChatBotResponse>(invoke1, request1);
    return mergeResponses(
      mediaRenditionCalculationServiceApi.GetRenditionRatesResponse.fromPartial({
        rendition: { audit: { updatedAt: reply1?.chatBot?.audit?.updatedAt } },
        result: { correlationId: (reply1?.result?.correlationId ?? "") },
      }),
      mediaRenditionCalculationServiceApi.GetRenditionRatesResponse.fromPartial({ rendition: { renditionId: (req?.renditionId ?? "") } }),
    );
  }

  /**
   * Quotes a rendition.
   */
  async quoteRendition(req: mediaRenditionCalculationServiceApi.QuoteRenditionRequest): Promise<mediaRenditionCalculationServiceApi.QuoteRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "QuoteRendition", req);
    this.logger.info("quote_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      details: {
        destination: { postalCode: (req?.details?.destination?.postalCode ?? "") },
      },
      mediaAsset: {
        locator: { $case: "address", address: {
          recipient: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.recipient ?? ""),
        } },
      },
    });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke1, spread1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.QuoteRenditionResponse.fromPartial({
        rendition: { audit: { updatedAt: reply1?.mediaAsset?.audit?.updatedAt } },
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
      }),
      mediaRenditionCalculationServiceApi.QuoteRenditionResponse.fromPartial({
        breakdown: { currencyCode: (req?.details?.currencyCode ?? "") },
        rendition: { renditionId: (req?.renditionId ?? "") },
      }),
    );
  }

  /**
   * Recalculates a rendition.
   */
  async recalculateRenditions(req: mediaRenditionCalculationServiceApi.RecalculateRenditionsRequest): Promise<mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "RecalculateRenditions", req);
    this.logger.info("recalculate_renditions", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest.fromPartial({
      context: input1?.context,
      details: {
        destination: {
          recipient: ((input1?.rendition?.locator?.$case === "address" ? input1?.rendition?.locator.address : undefined)?.recipient ?? ""),
        },
      },
    });
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.recalculateMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsRequest, mediaMediaAssetCalculationServiceApi.RecalculateMediaAssetsResponse>(invoke1, request1);
    const request2 = personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest.fromPartial({
      context: req?.context,
      recommendation: {
        billingAddress: { locality: (req?.details?.destination?.locality ?? "") },
      },
    });
    const cloned2: personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest = JSON.parse(JSON.stringify(request2));
    const invoke2: Unary<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse> =
      (input, done) => this.personalizationRecommendationCalculationClient.explainRecommendationCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationRequest, personalizationRecommendationCalculationServiceApi.ExplainRecommendationCalculationResponse>(invoke2, cloned2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse.fromPartial({
        rendition: {
          components: { primary: {
            description: (reply1?.mediaAsset?.components?.["primary"]?.description ?? ""),
            quantity: (reply1?.mediaAsset?.components?.["primary"]?.quantity ?? 0),
          } },
        },
      }),
      mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse.fromPartial({
        rendition: { owner: { email: (reply2?.recommendation?.counterparty?.email ?? "") } },
      }),
      mediaRenditionCalculationServiceApi.RecalculateRenditionsResponse.fromPartial({
        rendition: {
          code: (req?.rendition?.code ?? ""),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }

  /**
   * Simulates a rendition.
   */
  async simulateRendition(req: mediaRenditionCalculationServiceApi.SimulateRenditionRequest): Promise<mediaRenditionCalculationServiceApi.SimulateRenditionResponse> {
    validateContext(req.context);
    if (req.rendition) {
      await this.repository.save(toRenditionRecord(req.context.tenantId, req.rendition));
    }
    await this.repository.record(req.context.tenantId, "SimulateRendition", req);
    this.logger.info("simulate_rendition", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: { postalCode: (req?.details?.destination?.postalCode ?? "") } },
        dimensions: {
          height: (req?.rendition?.dimensions?.height ?? 0),
          width: (req?.rendition?.dimensions?.width ?? 0),
        },
      },
    });
    const decoded1 = mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.fromJSON(
      JSON.parse(JSON.stringify(mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest.toJSON(request1))),
    );
    const invoke1: Unary<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.quoteMediaAsset(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetCalculationServiceApi.QuoteMediaAssetRequest, mediaMediaAssetCalculationServiceApi.QuoteMediaAssetResponse>(invoke1, decoded1);
    const request2 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.fromPartial({
      context: req?.context,
      mediaAsset: {
        locator: { $case: "address", address: {
          postalCode: ((req?.rendition?.locator?.$case === "address" ? req?.rendition?.locator.address : undefined)?.postalCode ?? ""),
        } },
        dimensions: {
          height: (req?.rendition?.dimensions?.height ?? 0),
          unit: (req?.rendition?.dimensions?.unit ?? ""),
        },
      },
    });
    const envelope2 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.CompareMediaAssetOptionsRequest",
      value: Buffer.from(mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.encode(request2).finish()),
    });
    const unpacked2 = mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest.decode(envelope2.value);
    const invoke2: Unary<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse> =
      (input, done) => this.mediaMediaAssetCalculationClient.compareMediaAssetOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsRequest, mediaMediaAssetCalculationServiceApi.CompareMediaAssetOptionsResponse>(invoke2, unpacked2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      mediaRenditionCalculationServiceApi.SimulateRenditionResponse.fromPartial({ result: { message: (reply1?.result?.message ?? "") } }),
      mediaRenditionCalculationServiceApi.SimulateRenditionResponse.fromPartial({
        rendition: {
          components: { primary: {
            componentId: (reply2?.mediaAsset?.components?.["primary"]?.componentId ?? ""),
          } },
        },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      mediaRenditionCalculationServiceApi.SimulateRenditionResponse.fromPartial({
        rendition: {
          capacity: (req?.rendition?.capacity ?? 0),
          renditionId: (req?.renditionId ?? ""),
        },
      }),
    );
  }
}
