/**
 * Manages media assets: creates, reads, changes, and lists them. Remote work stays behind typed client ports.
 */

import * as formsFormFieldValidationServiceApi from "../../../../.cache/proto/acme/forms/v1/form_field_validation_service.js";
import * as identityUserValidationServiceApi from "../../../../.cache/proto/acme/identity/v1/user_validation_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as maintenanceWorkOrderServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_service.js";
import * as mediaMediaAssetQueryServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_query_service.js";
import * as mediaMediaAssetServiceApi from "../../../../.cache/proto/acme/media/v1/media_asset_service.js";
import * as mediaRenditionCalculationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_calculation_service.js";
import * as mediaRenditionValidationServiceApi from "../../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as notificationsNotificationTemplateExportServiceApi from "../../../../.cache/proto/acme/notifications/v1/notification_template_export_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import * as googleTimestampApi from "../../../../.cache/proto/google/protobuf/timestamp.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError } from "../../../platform/errors.js";
import { Logger } from "../../../platform/logger.js";
import { mergeResponses } from "../../../platform/merge.js";
import { ClientRegistry } from "../../../platform/registry.js";
import {
  GrpcAdapter,
  call,
  metadataFor,
  operation,
  retry,
  type RequestPort,
  type Unary,
} from "../../../platform/rpc.js";
import { WorkQueue } from "../../../platform/work-queue.js";
import { toMediaAssetRecord } from "../data/records.js";
import { MediaRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate media asset operations and persist audit data.
 */
@injectable()
export class MediaAssetWorkflow {
  constructor(
    @inject(MediaRepository) private readonly repository: MediaRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.forms.v1.FormFieldValidationService") private readonly formsFormFieldValidationClient: formsFormFieldValidationServiceApi.FormFieldValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserValidationService") private readonly identityUserValidationClient: identityUserValidationServiceApi.UserValidationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderService") private readonly maintenanceWorkOrderClient: maintenanceWorkOrderServiceApi.WorkOrderServiceClient,
    @inject("grpc:acme.media.v1.MediaAssetQueryService") private readonly mediaMediaAssetQueryClient: mediaMediaAssetQueryServiceApi.MediaAssetQueryServiceClient,
    @inject("grpc:acme.media.v1.RenditionCalculationService") private readonly mediaRenditionCalculationClient: mediaRenditionCalculationServiceApi.RenditionCalculationServiceClient,
    @inject("grpc:acme.media.v1.RenditionValidationService") private readonly mediaRenditionValidationClient: mediaRenditionValidationServiceApi.RenditionValidationServiceClient,
    @inject("grpc:acme.notifications.v1.NotificationTemplateExportService") private readonly notificationsNotificationTemplateExportClient: notificationsNotificationTemplateExportServiceApi.NotificationTemplateExportServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Takes a stream of media assets and answers once at the end.
   */
  async batchCreateMediaAssets(req: mediaMediaAssetServiceApi.BatchCreateMediaAssetsRequest): Promise<mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchCreateMediaAssets", req);
    this.logger.info("batch_create_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    let selected1_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_1 = (((choice) => choice?.$case === "address" ? choice.address : undefined)((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.locator)?.region ?? "");
        break;
      default:
        selected1_1 = "";
    }
    let selected1_2: string | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_2 = ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.components?.["primary"]?.componentId ?? "");
        break;
      default:
        selected1_2 = "";
    }
    let selected1_3: googleTimestampApi.Timestamp | undefined;
    switch (req?.chunk?.$case) {
      case "record":
        selected1_3 = (req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.updatedAt;
        break;
      default:
        selected1_3 = undefined;
    }
    const request1 = mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: selected1_3,
        ownerId: (selected1_2 ?? ""),
        region: (selected1_1 ?? ""),
      },
    });
    const invoke1: Unary<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest, mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetQueryClient.browseMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaMediaAssetQueryServiceApi.BrowseMediaAssetsRequest, mediaMediaAssetQueryServiceApi.BrowseMediaAssetsResponse>(invoke1, request1);
    const request2 = identityUserValidationServiceApi.ExplainUserDecisionRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          name: (req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.name,
        },
      },
    });
    const { context: scope2, ...payload2 } = request2;
    const spread2 = { ...payload2, context: scope2 ?
      { ...scope2, baggage: { ...scope2.baggage } } : undefined };
    const invoke2: Unary<identityUserValidationServiceApi.ExplainUserDecisionRequest, identityUserValidationServiceApi.ExplainUserDecisionResponse> =
      (input, done) => this.identityUserValidationClient.explainUserDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<identityUserValidationServiceApi.ExplainUserDecisionRequest, identityUserValidationServiceApi.ExplainUserDecisionResponse>(invoke2, spread2);
    const { context: context3, ...body3 } = req;
    const input3 = { ...body3, context: context3 };
    const request3 = mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest.fromPartial({
      context: input3?.context,
      filter: {
        createdAfter: (input3?.chunk?.$case === "record" ? input3?.chunk.record : undefined)?.audit?.updatedAt,
        labels: Object.fromEntries(Object.entries(((input3?.chunk?.$case === "record" ? input3?.chunk.record : undefined)?.specs ?? {}))),
        ownerId: (reply2?.user?.relationshipManager?.userId ?? ""),
        region: (((choice) => choice?.$case === "address" ? choice.address : undefined)((input3?.chunk?.$case === "record" ? input3?.chunk.record : undefined)?.locator)?.region ?? ""),
      },
    });
    const invoke3: Unary<mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest, mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse> =
      (input, done) => this.mediaMediaAssetQueryClient.findMediaAssets(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<mediaMediaAssetQueryServiceApi.FindMediaAssetsRequest, mediaMediaAssetQueryServiceApi.FindMediaAssetsResponse>(invoke3, request3);
    let selected4_1: string | undefined;
    switch (req?.chunk?.$case) {
      case "header":
        selected4_1 = ((req?.chunk?.$case === "header" ? req?.chunk.header : undefined)?.submittedBy?.phone ?? "");
        break;
      default:
        selected4_1 = "";
    }
    const request4 = identityUserValidationServiceApi.NormalizeUserRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (selected4_1 ?? "") } },
    });
    const invoke4: Unary<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse> =
      (input, done) => this.identityUserValidationClient.normalizeUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<identityUserValidationServiceApi.NormalizeUserRequest, identityUserValidationServiceApi.NormalizeUserResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: ((req?.chunk?.$case === "record" ? req?.chunk.record : undefined)?.audit?.etag ?? "") });
    return mergeResponses(
      mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse.fromPartial({
        result: {
          referenceIds: (reply1?.result?.referenceIds ?? []),
          status: (reply1?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse.fromPartial({
        result: {
          message: (reply2?.outcome?.message ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse.fromPartial({
        result: {
          referenceIds: (reply3?.result?.referenceIds ?? []),
          status: (reply3?.result?.status ?? ""),
        },
      }),
      mediaMediaAssetServiceApi.BatchCreateMediaAssetsResponse.fromPartial({
        result: {
          details: (reply4?.result?.details ?? {}),
          referenceIds: (reply4?.result?.referenceIds ?? []),
        },
      }),
    );
  }

  /**
   * Returns several media assets at once.
   */
  async batchGetMediaAssets(req: mediaMediaAssetServiceApi.BatchGetMediaAssetsRequest): Promise<mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "BatchGetMediaAssets", req);
    this.logger.info("batch_get_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationLocaleCalculationServiceApi.SimulateLocaleRequest.fromPartial({
      context: req?.context,
      locale: {
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const decoded1 = localizationLocaleCalculationServiceApi.SimulateLocaleRequest.fromJSON(
      JSON.parse(JSON.stringify(localizationLocaleCalculationServiceApi.SimulateLocaleRequest.toJSON(request1))),
    );
    const invoke1: Unary<localizationLocaleCalculationServiceApi.SimulateLocaleRequest, localizationLocaleCalculationServiceApi.SimulateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.simulateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationLocaleCalculationServiceApi.SimulateLocaleRequest, localizationLocaleCalculationServiceApi.SimulateLocaleResponse>(invoke1, decoded1);
    return mediaMediaAssetServiceApi.BatchGetMediaAssetsResponse.fromPartial({
      mediaAssets: [{
        audit: { updatedBy: (reply1?.locale?.audit?.updatedBy ?? "") },
        owner: { email: (reply1?.locale?.owner?.email ?? "") },
      }],
    });
  }

  /**
   * Creates a media asset.
   */
  async createMediaAsset(req: mediaMediaAssetServiceApi.CreateMediaAssetRequest): Promise<mediaMediaAssetServiceApi.CreateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "CreateMediaAsset", req);
    this.logger.info("create_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          countryCode: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.countryCode ?? ""),
        } },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.media.v1.CompareRenditionOptionsRequest",
      value: Buffer.from(mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest.encode(request1).finish()),
    });
    const unpacked1 = mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest.decode(envelope1.value);
    const invoke1: Unary<mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest, mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse> =
      (input, done) => this.mediaRenditionCalculationClient.compareRenditionOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<mediaRenditionCalculationServiceApi.CompareRenditionOptionsRequest, mediaRenditionCalculationServiceApi.CompareRenditionOptionsResponse>(invoke1, unpacked1);
    this.logger.info("local_audit", { value: (req?.requestId ?? "") });
    return mergeResponses(
      mediaMediaAssetServiceApi.CreateMediaAssetResponse.fromPartial({
        mediaAsset: {
          code: (reply1?.rendition?.code ?? ""),
          owner: { email: (reply1?.rendition?.owner?.email ?? "") },
        },
      }),
      mediaMediaAssetServiceApi.CreateMediaAssetResponse.fromPartial({
        mediaAsset: {
          specs: (req?.mediaAsset?.specs ?? {}),
          status: req?.mediaAsset?.status,
        },
      }),
    );
  }

  /**
   * Returns a media asset.
   */
  async getMediaAsset(req: mediaMediaAssetServiceApi.GetMediaAssetRequest): Promise<mediaMediaAssetServiceApi.GetMediaAssetResponse> {
    validateContext(req.context);
    if (!req.mediaAssetId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "media_asset_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetMediaAsset", req);
    this.logger.info("get_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    return mediaMediaAssetServiceApi.GetMediaAssetResponse.fromPartial({ mediaAsset: { mediaAssetId: (req?.mediaAssetId ?? "") } });
  }

  /**
   * Lists media assets a page at a time.
   */
  async listMediaAssets(req: mediaMediaAssetServiceApi.ListMediaAssetsRequest): Promise<mediaMediaAssetServiceApi.ListMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListMediaAssets", req);
    this.logger.info("list_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetServiceApi.ListMediaAssetsResponse.fromPartial({});
  }

  /**
   * Lists media assets a page at a time.
   */
  async searchMediaAssets(req: mediaMediaAssetServiceApi.SearchMediaAssetsRequest): Promise<mediaMediaAssetServiceApi.SearchMediaAssetsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SearchMediaAssets", req);
    this.logger.info("search_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldValidationServiceApi.LintFormFieldsRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (req?.context?.actor?.email ?? "") } },
      formField: { owner: { userId: (req?.context?.actor?.userId ?? "") } },
    });
    const client1 = this.clients.get<formsFormFieldValidationServiceApi.FormFieldValidationServiceClient>("acme.forms.v1.FormFieldValidationService");
    const invoke1: Unary<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse> =
      (input, done) => client1.lintFormFields(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldValidationServiceApi.LintFormFieldsRequest, formsFormFieldValidationServiceApi.LintFormFieldsResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return mediaMediaAssetServiceApi.SearchMediaAssetsResponse.fromPartial({
      mediaAssets: [{ audit: { updatedAt: reply1?.formField?.audit?.updatedAt } }],
    });
  }

  /**
   * Changes a media asset.
   */
  async updateMediaAsset(req: mediaMediaAssetServiceApi.UpdateMediaAssetRequest): Promise<mediaMediaAssetServiceApi.UpdateMediaAssetResponse> {
    validateContext(req.context);
    if (req.mediaAsset) {
      await this.repository.save(toMediaAssetRecord(req.context.tenantId, req.mediaAsset));
    }
    await this.repository.record(req.context.tenantId, "UpdateMediaAsset", req);
    this.logger.info("update_media_asset", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = mediaRenditionValidationServiceApi.ScoreRenditionRequest.fromPartial({
      context: req?.context,
      rendition: {
        locator: { $case: "address", address: {
          locality: ((req?.mediaAsset?.locator?.$case === "address" ? req?.mediaAsset?.locator.address : undefined)?.locality ?? ""),
        } },
        components: { primary: {
          description: (req?.mediaAsset?.components?.["primary"]?.description ?? ""),
        } },
      },
    });
    const invoke1: Unary<mediaRenditionValidationServiceApi.ScoreRenditionRequest, mediaRenditionValidationServiceApi.ScoreRenditionResponse> =
      (input, done) => this.mediaRenditionValidationClient.scoreRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<mediaRenditionValidationServiceApi.ScoreRenditionRequest, mediaRenditionValidationServiceApi.ScoreRenditionResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    const request2 = maintenanceWorkOrderServiceApi.BatchGetWorkOrdersRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<maintenanceWorkOrderServiceApi.BatchGetWorkOrdersRequest, maintenanceWorkOrderServiceApi.BatchGetWorkOrdersResponse> =
      (input, done) => this.maintenanceWorkOrderClient.batchGetWorkOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await retry(() => call<maintenanceWorkOrderServiceApi.BatchGetWorkOrdersRequest, maintenanceWorkOrderServiceApi.BatchGetWorkOrdersResponse>(invoke2, request2));
    let selected3_1: Array<string> | undefined;
    switch (reply1?.rendition?.locator?.$case) {
      case "address":
        selected3_1 = ((reply1?.rendition?.locator?.$case === "address" ? reply1?.rendition?.locator.address : undefined)?.lines ?? []);
        break;
      default:
        selected3_1 = [];
    }
    const request3 = identityUserValidationServiceApi.LintUsersRequest.fromPartial({
      context: req?.context,
      user: {
        primaryAddress: { lines: (selected3_1 ?? []) },
        relationshipManager: { userId: (reply1?.rendition?.owner?.userId ?? "") },
      },
    });
    const invoke3: Unary<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse> =
      (input, done) => this.identityUserValidationClient.lintUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<identityUserValidationServiceApi.LintUsersRequest, identityUserValidationServiceApi.LintUsersResponse>(invoke3, request3);
    const request4 = localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest.fromPartial({
      context: req?.context,
      locale: {
        audit: {
          createdAt: reply1?.rendition?.audit?.createdAt,
          etag: (req?.mediaAsset?.audit?.etag ?? ""),
        },
      },
    });
    const invoke4: Unary<localizationLocaleCalculationServiceApi.CompareLocaleOptionsRequest, localizationLocaleCalculationServiceApi.CompareLocaleOptionsResponse> =
      (input, done) => this.localizationLocaleCalculationClient.compareLocaleOptions(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task4 = operation(invoke4)(request4);
    const reply4 = await task4();
    this.logger.info("local_audit", { value: (req?.mediaAsset?.audit?.updatedBy ?? "") });
    return mergeResponses(
      mediaMediaAssetServiceApi.UpdateMediaAssetResponse.fromPartial({
        mediaAsset: {
          components: { primary: {
            componentId: (reply1?.rendition?.components?.["primary"]?.componentId ?? ""),
          } },
          specs: (reply1?.rendition?.specs ?? {}),
        },
      }),
      mediaMediaAssetServiceApi.UpdateMediaAssetResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          message: (reply2?.result?.message ?? ""),
        },
      }),
      mediaMediaAssetServiceApi.UpdateMediaAssetResponse.fromPartial({ result: { status: (reply3?.outcome?.status ?? "") } }),
      mediaMediaAssetServiceApi.UpdateMediaAssetResponse.fromPartial({
        mediaAsset: { owner: reply4?.locale?.owner },
        result: { message: (reply4?.result?.message ?? "") },
      }),
      mediaMediaAssetServiceApi.UpdateMediaAssetResponse.fromPartial({
        mediaAsset: {
          capacity: (req?.mediaAsset?.capacity ?? 0),
          mediaAssetId: (req?.mediaAsset?.mediaAssetId ?? ""),
        },
      }),
    );
  }

  /**
   * Streams the changes of media assets as they happen.
   */
  async watchMediaAssets(req: mediaMediaAssetServiceApi.WatchMediaAssetsRequest): Promise<mediaMediaAssetServiceApi.WatchMediaAssetsResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "WatchMediaAssets", req);
    this.logger.info("watch_media_assets", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest.fromPartial({
      context: req?.context,
      details: { recipient: { email: (req?.subscriber?.email ?? "") } },
    });
    const reply1 = await this.workQueue.enqueue<notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportRequest, notificationsNotificationTemplateExportServiceApi.ShareNotificationTemplateExportResponse>(
      "acme.media.v1.MediaAssetService/WatchMediaAssets:0", request1,
    );
    const request2 = mediaRenditionCalculationServiceApi.EstimateRenditionRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          countryCode: (reply1?.notificationTemplate?.billingAddress?.countryCode ?? ""),
          region: (reply1?.notificationTemplate?.billingAddress?.region ?? ""),
        },
      },
      rendition: {
        audit: { createdBy: (reply1?.notificationTemplate?.audit?.createdBy ?? "") },
      },
    });
    const invoke2: Unary<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse> =
      (input, done) => this.mediaRenditionCalculationClient.estimateRendition(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<mediaRenditionCalculationServiceApi.EstimateRenditionRequest, mediaRenditionCalculationServiceApi.EstimateRenditionResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.subscriber?.preferredChannel ?? "") });
    return mergeResponses(
      mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({
        mediaAsset: { audit: { updatedAt: reply1?.notificationTemplate?.audit?.updatedAt } },
      }),
      mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({ mediaAsset: { categoryPath: (reply2?.rendition?.categoryPath ?? []) } }),
      mediaMediaAssetServiceApi.WatchMediaAssetsResponse.fromPartial({ mediaAsset: { owner: { email: (req?.subscriber?.email ?? "") } } }),
    );
  }
}
