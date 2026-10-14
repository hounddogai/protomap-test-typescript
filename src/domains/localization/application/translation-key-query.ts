/**
 * Answers read-only questions about translation keys, for screens and reports. Remote work stays behind typed client
 * ports.
 */

import * as experimentsExposureValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/exposure_validation_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as localizationLocaleCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/locale_calculation_service.js";
import * as localizationTranslationJobCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_calculation_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import * as localizationTranslationKeyQueryServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_query_service.js";
import * as localizationTranslationKeyValidationServiceApi from "../../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
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
import { WorkQueue } from "../../../platform/work-queue.js";
import { LocalizationRepository } from "../data/repository.js";
import { status } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate translation key operations and persist audit data.
 */
@injectable()
export class TranslationKeyQueryWorkflow {
  constructor(
    @inject(LocalizationRepository) private readonly repository: LocalizationRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.experiments.v1.ExposureValidationService") private readonly experimentsExposureValidationClient: experimentsExposureValidationServiceApi.ExposureValidationServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.localization.v1.LocaleCalculationService") private readonly localizationLocaleCalculationClient: localizationLocaleCalculationServiceApi.LocaleCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobCalculationService") private readonly localizationTranslationJobCalculationClient: localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationJobValidationService") private readonly localizationTranslationJobValidationClient: localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyCalculationService") private readonly localizationTranslationKeyCalculationClient: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient,
    @inject("grpc:acme.localization.v1.TranslationKeyValidationService") private readonly localizationTranslationKeyValidationClient: localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient,
    @inject("grpc:acme.personalization.v1.ProfileCalculationService") private readonly personalizationProfileCalculationClient: personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Lists translation keys a page at a time.
   */
  async browseTranslationKeys(req: localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "BrowseTranslationKeys", req);
    this.logger.info("browse_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyQueryServiceApi.BrowseTranslationKeysResponse.fromPartial({});
  }

  /**
   * Counts translation keys by status.
   */
  async countTranslationKeys(req: localizationTranslationKeyQueryServiceApi.CountTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.CountTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "CountTranslationKeys", req);
    this.logger.info("count_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({
      context: input1?.context,
      details: { destination: { region: (input1?.filter?.region ?? "") } },
      profile: { contact: { email: (input1?.context?.actor?.email ?? "") } },
    });
    const invoke1: Unary<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse> =
      (input, done) => this.personalizationProfileCalculationClient.calculateProfile(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyQueryServiceApi.CountTranslationKeysResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } });
  }

  /**
   * Streams every matching translation key.
   */
  async exportTranslationKeys(req: localizationTranslationKeyQueryServiceApi.ExportTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ExportTranslationKeys", req);
    this.logger.info("export_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        audit: { updatedAt: req?.filter?.createdAfter },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const cloned1: localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(invoke1, cloned1);
    const request2 = experimentsExposureValidationServiceApi.PreviewExposureRequest.fromPartial({
      context: req?.context,
      exposure: {
        measurements: [{ unit: (reply1?.translationKey?.dimensions?.unit ?? "") }],
      },
    });
    const decoded2 = experimentsExposureValidationServiceApi.PreviewExposureRequest.fromJSON(
      JSON.parse(JSON.stringify(experimentsExposureValidationServiceApi.PreviewExposureRequest.toJSON(request2))),
    );
    const invoke2: Unary<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse> =
      (input, done) => this.experimentsExposureValidationClient.previewExposure(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<experimentsExposureValidationServiceApi.PreviewExposureRequest, experimentsExposureValidationServiceApi.PreviewExposureResponse>(invoke2, decoded2);
    this.logger.info("local_audit", { value: (req?.destinationUri ?? "") });
    return mergeResponses(
      localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse.fromPartial({
        translationKey: {
          components: { primary: {
            quantity: (reply1?.translationKey?.components?.["primary"]?.quantity ?? 0),
          } },
          owner: reply1?.translationKey?.owner,
        },
      }),
      localizationTranslationKeyQueryServiceApi.ExportTranslationKeysResponse.fromPartial({
        result: {
          correlationId: (reply2?.exposure?.correlationId ?? ""),
          message: (reply2?.outcome?.message ?? ""),
        },
      }),
    );
  }

  /**
   * Lists translation keys a page at a time.
   */
  async findTranslationKeys(req: localizationTranslationKeyQueryServiceApi.FindTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.FindTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "FindTranslationKeys", req);
    this.logger.info("find_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyQueryServiceApi.FindTranslationKeysResponse.fromPartial({});
  }

  /**
   * Returns a translation key.
   */
  async lookupTranslationKey(req: localizationTranslationKeyQueryServiceApi.LookupTranslationKeyRequest): Promise<localizationTranslationKeyQueryServiceApi.LookupTranslationKeyResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "LookupTranslationKey", req);
    this.logger.info("lookup_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const envelope1 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.localization.v1.QuoteTranslationJobRequest",
      value: Buffer.from(localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.encode(request1).finish()),
    });
    const unpacked1 = localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.decode(envelope1.value);
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.quoteTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse>(invoke1, unpacked1);
    return mergeResponses(
      localizationTranslationKeyQueryServiceApi.LookupTranslationKeyResponse.fromPartial({
        translationKey: {
          audit: { createdBy: (reply1?.translationJob?.audit?.createdBy ?? "") },
          owner: { email: (reply1?.translationJob?.requester?.email ?? "") },
        },
      }),
      localizationTranslationKeyQueryServiceApi.LookupTranslationKeyResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } }),
    );
  }

  /**
   * Returns a translation key.
   */
  async peekTranslationKey(req: localizationTranslationKeyQueryServiceApi.PeekTranslationKeyRequest): Promise<localizationTranslationKeyQueryServiceApi.PeekTranslationKeyResponse> {
    validateContext(req.context);
    if (!req.translationKeyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "translation_key_id is required");
    }
    await this.repository.record(req.context.tenantId, "PeekTranslationKey", req);
    this.logger.info("peek_translation_key", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest.fromPartial({
      context: req?.context,
      translationJob: {
        assignee: { userId: (req?.context?.actor?.userId ?? "") },
        history: [{ changedAt: req?.context?.deadline }],
        requester: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const client1 = this.clients.get<localizationTranslationJobCalculationServiceApi.TranslationJobCalculationServiceClient>("acme.localization.v1.TranslationJobCalculationService");
    const invoke1: Unary<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse> =
      (input, done) => client1.quoteTranslationJob(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<localizationTranslationJobCalculationServiceApi.QuoteTranslationJobRequest, localizationTranslationJobCalculationServiceApi.QuoteTranslationJobResponse>(invoke1, request1);
    const request2 = localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest.fromPartial({
      context: req?.context,
      translationJob: {
        origin: { $case: "customer", customer: { email: (reply1?.translationJob?.assignee?.email ?? "") } },
      },
    });
    const invoke2: Unary<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse> =
      (input, done) => this.localizationTranslationJobValidationClient.explainTranslationJobDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port2: RequestPort<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse> = new GrpcAdapter(invoke2);
    const reply2 = await port2.execute(request2);
    return mergeResponses(
      localizationTranslationKeyQueryServiceApi.PeekTranslationKeyResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      localizationTranslationKeyQueryServiceApi.PeekTranslationKeyResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        translationKey: { audit: { updatedAt: reply2?.translationJob?.audit?.updatedAt } },
      }),
      localizationTranslationKeyQueryServiceApi.PeekTranslationKeyResponse.fromPartial({ translationKey: { translationKeyId: (req?.translationKeyId ?? "") } }),
    );
  }

  /**
   * Returns several translation keys at once.
   */
  async resolveTranslationKeys(req: localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "ResolveTranslationKeys", req);
    this.logger.info("resolve_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        audit: { updatedAt: req?.context?.deadline },
        owner: {
          email: (req?.context?.actor?.email ?? ""),
          userId: (req?.context?.actor?.userId ?? ""),
        },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse>(invoke1, request1));
    const request2 = ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { updatedBy: (reply1?.translationKey?.audit?.updatedBy ?? "") },
        holder: { displayName: (reply1?.translationKey?.owner?.displayName ?? "") },
      },
    });
    const invoke2: Unary<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.createLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("ResolveTranslationKeys.CreateLedgerAccount", () => call<ledgerLedgerAccountServiceApi.CreateLedgerAccountRequest, ledgerLedgerAccountServiceApi.CreateLedgerAccountResponse>(invoke2, request2));
    return mergeResponses(
      localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse.fromPartial({ translationKeys: [{ tags: (reply1?.translationKey?.tags ?? []) }] }),
      localizationTranslationKeyQueryServiceApi.ResolveTranslationKeysResponse.fromPartial({
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
        translationKeys: [{ owner: { email: (reply2?.ledgerAccount?.contact?.email ?? "") } }],
      }),
    );
  }

  /**
   * Lists translation keys a page at a time.
   */
  async suggestTranslationKeys(req: localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "SuggestTranslationKeys", req);
    this.logger.info("suggest_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest.fromPartial({
      context: req?.context,
      translationKey: {
        locator: { $case: "address", address: { region: (req?.filter?.region ?? "") } },
        owner: { email: (req?.context?.actor?.email ?? "") },
      },
    });
    const invoke1: Unary<localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.CalculateTranslationKeyResponse> =
      (input, done) => this.localizationTranslationKeyCalculationClient.calculateTranslationKey(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return localizationTranslationKeyQueryServiceApi.SuggestTranslationKeysResponse.fromPartial({ result: { details: (reply1?.result?.details ?? {}) } });
  }

  /**
   * Summarizes a translation key.
   */
  async summarizeTranslationKeys(req: localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysRequest): Promise<localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse> {
    validateContext(req.context);
    await this.repository.record(req.context.tenantId, "SummarizeTranslationKeys", req);
    this.logger.info("summarize_translation_keys", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest.fromPartial({
      context: req?.context,
      translationKey: { translationKeyId: (req?.translationKeyId ?? "") },
    });
    const reply1 = await this.workQueue.enqueue<localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityRequest, localizationTranslationKeyValidationServiceApi.CheckTranslationKeyEligibilityResponse>(
      "acme.localization.v1.TranslationKeyQueryService/SummarizeTranslationKeys:0", request1,
    );
    let selected2_1: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_1 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.postalCode ?? "");
        break;
      default:
        selected2_1 = "";
    }
    let selected2_3: string | undefined;
    switch (reply1?.translationKey?.locator?.$case) {
      case "address":
        selected2_3 = ((reply1?.translationKey?.locator?.$case === "address" ? reply1?.translationKey?.locator.address : undefined)?.locality ?? "");
        break;
      default:
        selected2_3 = "";
    }
    const request2 = localizationLocaleCalculationServiceApi.SimulateLocaleRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          locality: (selected2_3 ?? ""),
          postalCode: (selected2_1 ?? ""),
        },
      },
      locale: { audit: { etag: (reply1?.translationKey?.audit?.etag ?? "") } },
    });
    const invoke2: Unary<localizationLocaleCalculationServiceApi.SimulateLocaleRequest, localizationLocaleCalculationServiceApi.SimulateLocaleResponse> =
      (input, done) => this.localizationLocaleCalculationClient.simulateLocale(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<localizationLocaleCalculationServiceApi.SimulateLocaleRequest, localizationLocaleCalculationServiceApi.SimulateLocaleResponse>(invoke2, request2);
    const request3 = localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest.fromPartial({
      context: req?.context,
      translationJob: { audit: { etag: (reply2?.locale?.audit?.etag ?? "") } },
    });
    const invoke3: Unary<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsRequest, localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse> =
      (input, done) => this.localizationTranslationJobCalculationClient.recalculateTranslationJobs(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<localizationTranslationJobCalculationServiceApi.RecalculateTranslationJobsResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    const request4 = experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest.fromPartial({
      context: req?.context,
      details: { contact: { email: (reply3?.translationJob?.assignee?.email ?? "") } },
    });
    const invoke4: Unary<experimentsExposureValidationServiceApi.ExplainExposureDecisionRequest, experimentsExposureValidationServiceApi.ExplainExposureDecisionResponse> =
      (input, done) => this.experimentsExposureValidationClient.explainExposureDecision(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send4 = promised(invoke4);
    const reply4 = await send4(request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse.fromPartial({ result: { status: (reply1?.result?.status ?? "") } }),
      localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse.fromPartial({
        result: {
          details: (reply2?.result?.details ?? {}),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse.fromPartial({ result: { status: (reply3?.result?.status ?? "") } }),
      localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse.fromPartial({ result: { correlationId: (reply4?.exposure?.correlationId ?? "") } }),
      localizationTranslationKeyQueryServiceApi.SummarizeTranslationKeysResponse.fromPartial({ period: req?.details?.period }),
    );
  }
}
