/**
 * Computes the figures of a taxonomy, such as totals, taxes, and estimates. Remote work stays behind typed client
 * ports.
 */

import * as anomaliesAnomalyServiceApi from "../../../../../.cache/proto/acme/anomalies/v1/anomaly_service.js";
import * as contentContentBlockCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_calculation_service.js";
import * as contentContentBlockValidationServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as formsFormCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as localizationLocaleQueryServiceApi from "../../../../../.cache/proto/acme/localization/v1/locale_query_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import { inRequest, validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
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
} from "../../../../platform/rpc.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toTaxonomyRecord } from "../../data/records.js";
import { ContentRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate taxonomy operations and persist audit data.
 */
@injectable()
export class TaxonomyCalculationWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.anomalies.v1.AnomalyService") private readonly anomaliesAnomalyClient: anomaliesAnomalyServiceApi.AnomalyServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockCalculationService") private readonly contentContentBlockCalculationClient: contentContentBlockCalculationServiceApi.ContentBlockCalculationServiceClient,
    @inject("grpc:acme.content.v1.ContentBlockValidationService") private readonly contentContentBlockValidationClient: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient,
    @inject("grpc:acme.forms.v1.FormCalculationService") private readonly formsFormCalculationClient: formsFormCalculationServiceApi.FormCalculationServiceClient,
    @inject("grpc:acme.forms.v1.FormFieldCalculationService") private readonly formsFormFieldCalculationClient: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient,
    @inject("grpc:acme.localization.v1.LocaleQueryService") private readonly localizationLocaleQueryClient: localizationLocaleQueryServiceApi.LocaleQueryServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Calculates a taxonomy.
   */
  async calculateTaxonomy(req: contentTaxonomyCalculationServiceApi.CalculateTaxonomyRequest): Promise<contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "CalculateTaxonomy", req);
    this.logger.info("calculate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest.fromPartial({
      context: req?.context,
      reason: (req?.reason ?? ""),
    });
    const invoke1: Unary<searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest, searchSearchIndexQueryServiceApi.SummarizeSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.summarizeSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<searchSearchIndexQueryServiceApi.SummarizeSearchIndexesRequest, searchSearchIndexQueryServiceApi.SummarizeSearchIndexesResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    this.logger.info("local_audit", { value: (req?.details?.destination?.countryCode ?? "") });
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse.fromPartial({
        result: {
          message: (reply1?.result?.message ?? ""),
          referenceIds: (reply1?.result?.referenceIds ?? []),
        },
      }),
      contentTaxonomyCalculationServiceApi.CalculateTaxonomyResponse.fromPartial({
        taxonomy: {
          parentId: (req?.taxonomy?.parentId ?? ""),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Compares a taxonomy.
   */
  async compareTaxonomyOptions(req: contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsRequest): Promise<contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "CompareTaxonomyOptions", req);
    this.logger.info("compare_taxonomy_options", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.taxonomy?.audit?.createdAt,
              createdBy: (req?.taxonomy?.audit?.createdBy ?? ""),
            },
            location: {
              locality: (req?.details?.destination?.locality ?? ""),
              recipient: (req?.details?.destination?.recipient ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke1, request1));
    const request2 = localizationLocaleQueryServiceApi.ResolveLocalesRequest.fromPartial({ context: req?.context });
    const invoke2: Unary<localizationLocaleQueryServiceApi.ResolveLocalesRequest, localizationLocaleQueryServiceApi.ResolveLocalesResponse> =
      (input, done) => this.localizationLocaleQueryClient.resolveLocales(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("CompareTaxonomyOptions.ResolveLocales", () => call<localizationLocaleQueryServiceApi.ResolveLocalesRequest, localizationLocaleQueryServiceApi.ResolveLocalesResponse>(invoke2, request2));
    const request3 = contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { createdBy: (req?.taxonomy?.audit?.createdBy ?? "") },
            location: { region: (req?.taxonomy?.location?.region ?? "") },
            manager: { email: (req?.taxonomy?.manager?.email ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke3: Unary<contentContentBlockCalculationServiceApi.RecalculateContentBlocksRequest, contentContentBlockCalculationServiceApi.RecalculateContentBlocksResponse> =
      (input, done) => this.contentContentBlockCalculationClient.recalculateContentBlocks(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task3 = operation(invoke3)(request3);
    const reply3 = await task3();
    const request4 = contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: { updatedBy: (req?.taxonomy?.audit?.updatedBy ?? "") },
            location: { countryCode: (req?.details?.destination?.countryCode ?? "") },
            manager: { displayName: (reply1?.contentBlock?.manager?.displayName ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const reply4 = await this.workQueue.enqueue<contentContentBlockValidationServiceApi.ExplainContentBlockDecisionRequest, contentContentBlockValidationServiceApi.ExplainContentBlockDecisionResponse>(
      "acme.content.v1.TaxonomyCalculationService/CompareTaxonomyOptions:3", request4,
    );
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{ children: [{ depth: (reply1?.contentBlock?.depth ?? 0) }] }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse.fromPartial({ result: { correlationId: (reply2?.result?.correlationId ?? "") } }),
      contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse.fromPartial({
        taxonomy: {
          children: [{
            attributes: (reply3?.contentBlock?.attributes ?? {}),
            children: [{ audit: { updatedBy: (reply3?.contentBlock?.audit?.updatedBy ?? "") } }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse.fromPartial({
        taxonomy: { children: [{ depth: (reply4?.contentBlock?.depth ?? 0) }] },
      }),
      contentTaxonomyCalculationServiceApi.CompareTaxonomyOptionsResponse.fromPartial({
        taxonomy: {
          status: req?.taxonomy?.status,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Estimates a taxonomy.
   */
  async estimateTaxonomy(req: contentTaxonomyCalculationServiceApi.EstimateTaxonomyRequest): Promise<contentTaxonomyCalculationServiceApi.EstimateTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "EstimateTaxonomy", req);
    this.logger.info("estimate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.EstimateContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              createdAt: req?.taxonomy?.audit?.createdAt,
              etag: (req?.taxonomy?.audit?.etag ?? ""),
              updatedBy: (req?.taxonomy?.audit?.updatedBy ?? ""),
            },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.estimateContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await inRequest(req.context!, () => call<contentContentBlockCalculationServiceApi.EstimateContentBlockRequest, contentContentBlockCalculationServiceApi.EstimateContentBlockResponse>(invoke1, request1));
    const request2 = contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{
            audit: {
              etag: (reply1?.contentBlock?.audit?.etag ?? ""),
              updatedBy: (reply1?.contentBlock?.audit?.updatedBy ?? ""),
            },
            location: { postalCode: (req?.taxonomy?.location?.postalCode ?? "") },
          }],
        }],
      },
      context: req?.context,
    });
    const invoke2: Unary<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationRequest, contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse> =
      (input, done) => this.contentContentBlockCalculationClient.explainContentBlockCalculation(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await new Promise<contentContentBlockCalculationServiceApi.ExplainContentBlockCalculationResponse>((resolve, reject) => {
      invoke2(request2, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.EstimateTaxonomyResponse.fromPartial({
        result: { referenceIds: (reply1?.result?.referenceIds ?? []) },
        taxonomy: {
          children: [{
            children: [{ children: [{ depth: (reply1?.contentBlock?.depth ?? 0) }] }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.EstimateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{
              children: [{ parentId: (reply2?.contentBlock?.parentId ?? "") }],
              manager: { email: (reply2?.contentBlock?.manager?.email ?? "") },
            }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.EstimateTaxonomyResponse.fromPartial({
        taxonomy: {
          depth: (req?.taxonomy?.depth ?? 0),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Explains a taxonomy.
   */
  async explainTaxonomyCalculation(req: contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationRequest): Promise<contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "ExplainTaxonomyCalculation", req);
    this.logger.info("explain_taxonomy_calculation", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormCalculationServiceApi.SimulateFormRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          postalCode: (req?.taxonomy?.location?.postalCode ?? ""),
          recipient: (req?.taxonomy?.location?.recipient ?? ""),
        },
      },
      form: { billingAddress: { region: (req?.taxonomy?.location?.region ?? "") } },
    });
    const invoke1: Unary<formsFormCalculationServiceApi.SimulateFormRequest, formsFormCalculationServiceApi.SimulateFormResponse> =
      (input, done) => this.formsFormCalculationClient.simulateForm(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: { createdBy: (reply1?.form?.audit?.createdBy ?? "") },
            children: [{ manager: { email: (reply1?.form?.counterparty?.email ?? "") } }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.ExplainTaxonomyCalculationResponse.fromPartial({
        taxonomy: {
          depth: (req?.taxonomy?.depth ?? 0),
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }

  /**
   * Returns a taxonomy.
   */
  async getTaxonomyRates(req: contentTaxonomyCalculationServiceApi.GetTaxonomyRatesRequest): Promise<contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse> {
    validateContext(req.context);
    if (!req.taxonomyId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "taxonomy_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetTaxonomyRates", req);
    this.logger.info("get_taxonomy_rates", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentContentBlockCalculationServiceApi.QuoteContentBlockRequest.fromPartial({
      contentBlock: {
        children: [{
          children: [{ manager: { userId: (req?.context?.actor?.userId ?? "") } }],
          manager: { email: (req?.context?.actor?.email ?? "") },
        }],
      },
      context: req?.context,
    });
    const invoke1: Unary<contentContentBlockCalculationServiceApi.QuoteContentBlockRequest, contentContentBlockCalculationServiceApi.QuoteContentBlockResponse> =
      (input, done) => this.contentContentBlockCalculationClient.quoteContentBlock(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse.fromPartial({
        taxonomy: {
          children: [{
            children: [{
              audit: { updatedBy: (reply1?.contentBlock?.audit?.updatedBy ?? "") },
              depth: (reply1?.contentBlock?.depth ?? 0),
            }],
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.GetTaxonomyRatesResponse.fromPartial({ taxonomy: { taxonomyId: (req?.taxonomyId ?? "") } }),
    );
  }

  /**
   * Simulates a taxonomy.
   */
  async simulateTaxonomy(req: contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest): Promise<contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse> {
    validateContext(req.context);
    if (req.taxonomy) {
      await this.repository.save(toTaxonomyRecord(req.context.tenantId, req.taxonomy));
    }
    await this.repository.record(req.context.tenantId, "SimulateTaxonomy", req);
    this.logger.info("simulate_taxonomy", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = formsFormFieldCalculationServiceApi.SimulateFormFieldRequest.fromPartial({
      context: req?.context,
      details: {
        destination: {
          lines: (req?.taxonomy?.location?.lines ?? []).map((value) => value),
          postalCode: (req?.details?.destination?.postalCode ?? ""),
        },
      },
    });
    const method1 = "simulateFormField" as const;
    const invoke1: Unary<formsFormFieldCalculationServiceApi.SimulateFormFieldRequest, formsFormFieldCalculationServiceApi.SimulateFormFieldResponse> =
      (input, done) => this.formsFormFieldCalculationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<formsFormFieldCalculationServiceApi.SimulateFormFieldRequest, formsFormFieldCalculationServiceApi.SimulateFormFieldResponse>(invoke1, request1);
    const request2 = anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest.fromPartial({ context: req?.context });
    const proxy2 = forwarding(this.anomaliesAnomalyClient);
    const invoke2: Unary<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse> =
      (input, done) => proxy2.batchGetAnomalies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<anomaliesAnomalyServiceApi.BatchGetAnomaliesRequest, anomaliesAnomalyServiceApi.BatchGetAnomaliesResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse.fromPartial({
        taxonomy: {
          children: [{
            audit: {
              createdBy: (reply1?.formField?.audit?.createdBy ?? ""),
              updatedBy: (reply1?.formField?.audit?.updatedBy ?? ""),
            },
          }],
        },
      }),
      contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          referenceIds: (reply2?.result?.referenceIds ?? []),
        },
      }),
      contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse.fromPartial({
        taxonomy: {
          manager: req?.taxonomy?.manager,
          taxonomyId: (req?.taxonomyId ?? ""),
        },
      }),
    );
  }
}
