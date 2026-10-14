/**
 * Runs the long-lived workflow that takes a content block from start to finish. Remote work stays behind typed client
 * ports.
 */

import * as authorizationAccessPolicyQueryServiceApi from "../../../../../.cache/proto/acme/authorization/v1/access_policy_query_service.js";
import * as contentArticleWorkflowServiceApi from "../../../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as contentContentBlockWorkflowServiceApi from "../../../../../.cache/proto/acme/content/v1/content_block_workflow_service.js";
import * as contentTaxonomyCalculationServiceApi from "../../../../../.cache/proto/acme/content/v1/taxonomy_calculation_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as customersHouseholdQueryServiceApi from "../../../../../.cache/proto/acme/customers/v1/household_query_service.js";
import * as identityUserServiceApi from "../../../../../.cache/proto/acme/identity/v1/user_service.js";
import { validateContext } from "../../../../platform/context.js";
import { RpcError, requireReply } from "../../../../platform/errors.js";
import { Logger } from "../../../../platform/logger.js";
import { mergeResponses } from "../../../../platform/merge.js";
import { ClientRegistry } from "../../../../platform/registry.js";
import { call, forwarding, metadataFor, promised, type Unary } from "../../../../platform/rpc.js";
import { collect } from "../../../../platform/streams.js";
import { WorkQueue } from "../../../../platform/work-queue.js";
import { toContentBlockRecord } from "../../data/records.js";
import { ContentRepository } from "../../data/repository.js";
import { status } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate content block operations and persist audit data.
 */
@injectable()
export class ContentBlockWorkflowWorkflow {
  constructor(
    @inject(ContentRepository) private readonly repository: ContentRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.authorization.v1.AccessPolicyQueryService") private readonly authorizationAccessPolicyQueryClient: authorizationAccessPolicyQueryServiceApi.AccessPolicyQueryServiceClient,
    @inject("grpc:acme.content.v1.ArticleWorkflowService") private readonly contentArticleWorkflowClient: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient,
    @inject("grpc:acme.content.v1.TaxonomyCalculationService") private readonly contentTaxonomyCalculationClient: contentTaxonomyCalculationServiceApi.TaxonomyCalculationServiceClient,
    @inject("grpc:acme.customers.v1.CustomerSegmentValidationService") private readonly customersCustomerSegmentValidationClient: customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient,
    @inject("grpc:acme.customers.v1.HouseholdQueryService") private readonly customersHouseholdQueryClient: customersHouseholdQueryServiceApi.HouseholdQueryServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Advances a content block.
   */
  async advanceContentBlockWorkflow(req: contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowRequest): Promise<contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "AdvanceContentBlockWorkflow", req);
    this.logger.info("advance_content_block_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest.fromPartial({
      article: {
        billingAddress: { countryCode: (req?.contentBlock?.location?.countryCode ?? "") },
      },
      context: req?.context,
      details: { notify: { name: req?.details?.notify?.name } },
    });
    const invoke1: Unary<contentArticleWorkflowServiceApi.RetryArticleWorkflowRequest, contentArticleWorkflowServiceApi.RetryArticleWorkflowResponse> =
      (input, done) => this.contentArticleWorkflowClient.retryArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          children: [{
            audit: { updatedAt: reply1?.article?.audit?.updatedAt },
            children: [{ audit: { etag: (reply1?.article?.audit?.etag ?? "") } }],
          }],
        },
      }),
      contentContentBlockWorkflowServiceApi.AdvanceContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          parentId: (req?.contentBlock?.parentId ?? ""),
        },
      }),
    );
  }

  /**
   * Cancels a content block.
   */
  async cancelContentBlockWorkflow(req: contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowRequest): Promise<contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "CancelContentBlockWorkflow", req);
    this.logger.info("cancel_content_block_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.BatchGetUsersRequest.fromPartial({ context: req?.context });
    const invoke1: Unary<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> =
      (input, done) => this.identityUserClient.batchGetUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse.fromPartial({
        result: {
          correlationId: (reply1?.result?.correlationId ?? ""),
          message: (reply1?.result?.message ?? ""),
        },
      }),
      contentContentBlockWorkflowServiceApi.CancelContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          attributes: (req?.contentBlock?.attributes ?? {}),
          contentBlockId: (req?.contentBlockId ?? ""),
        },
      }),
    );
  }

  /**
   * Lists content blocks a page at a time.
   */
  async listContentBlockWorkflows(req: contentContentBlockWorkflowServiceApi.ListContentBlockWorkflowsRequest): Promise<contentContentBlockWorkflowServiceApi.ListContentBlockWorkflowsResponse> {
    validateContext(req.context);
    if ((req.page?.pageSize ?? 0) < 0 || (req.page?.pageSize ?? 0) > 500) {
      throw new RpcError(status.INVALID_ARGUMENT, "page_size must be between 0 and 500");
    }
    await this.repository.record(req.context.tenantId, "ListContentBlockWorkflows", req);
    this.logger.info("list_content_block_workflows", { tenant: req.context.tenantId, trace: req.context.traceId });
    this.logger.info("local_audit", { value: (req?.orderBy ?? "") });
    return contentContentBlockWorkflowServiceApi.ListContentBlockWorkflowsResponse.fromPartial({});
  }

  /**
   * Resumes a content block.
   */
  async resumeContentBlockWorkflow(req: contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowRequest): Promise<contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "ResumeContentBlockWorkflow", req);
    this.logger.info("resume_content_block_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest.fromPartial({
      context: req?.context,
      customerSegment: {
        audit: {
          createdBy: (req?.contentBlock?.audit?.createdBy ?? ""),
          updatedAt: req?.contentBlock?.audit?.updatedAt,
        },
      },
      details: { contact: { phone: (req?.details?.notify?.phone ?? "") } },
    });
    const method1 = "previewCustomerSegment" as const;
    const invoke1: Unary<customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentResponse> =
      (input, done) => this.customersCustomerSegmentValidationClient[method1](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentRequest, customersCustomerSegmentValidationServiceApi.PreviewCustomerSegmentResponse>(invoke1, request1);
    const request2 = contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest.fromPartial({
      article: {
        billingAddress: { postalCode: (req?.contentBlock?.location?.postalCode ?? "") },
      },
      context: req?.context,
      details: {
        notify: {
          email: (req?.contentBlock?.manager?.email ?? ""),
          phone: (req?.details?.notify?.phone ?? ""),
        },
      },
    });
    const proxy2 = forwarding(this.contentArticleWorkflowClient);
    const invoke2: Unary<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse> =
      (input, done) => proxy2.cancelArticleWorkflow(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse>(invoke2, request2);
    let selected3_2: string | undefined;
    switch (reply1?.customerSegment?.action?.$case) {
      case "block":
        selected3_2 = ((reply1?.customerSegment?.action?.$case === "block" ? reply1?.customerSegment?.action.block : undefined)?.reason ?? "");
        break;
      default:
        selected3_2 = "";
    }
    const request3 = authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest.fromPartial({
      annotations: Object.fromEntries(Object.entries((req?.annotations ?? {}))),
      context: req?.context,
      details: {
        filters: Object.fromEntries(Object.entries((reply1?.customerSegment?.parameters ?? {}))),
        period: reply1?.customerSegment?.effective,
      },
      reason: (selected3_2 ?? ""),
    });
    const invoke3: Unary<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse> =
      (input, done) => this.authorizationAccessPolicyQueryClient.summarizeAccessPolicies(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesRequest, authorizationAccessPolicyQueryServiceApi.SummarizeAccessPoliciesResponse>(invoke3, request3);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ manager: { email: (reply1?.customerSegment?.owner?.email ?? "") } }],
          }],
        },
      }),
      contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          children: [{
            location: { countryCode: (reply2?.article?.billingAddress?.countryCode ?? "") },
          }],
        },
        result: { message: (reply2?.result?.message ?? "") },
      }),
      contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse.fromPartial({
        result: {
          details: (reply3?.result?.details ?? {}),
          referenceIds: (reply3?.result?.referenceIds ?? []),
        },
      }),
      contentContentBlockWorkflowServiceApi.ResumeContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          manager: req?.contentBlock?.manager,
        },
      }),
    );
  }

  /**
   * Retrys a content block.
   */
  async retryContentBlockWorkflow(req: contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowRequest): Promise<contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "RetryContentBlockWorkflow", req);
    this.logger.info("retry_content_block_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.BatchGetUsersRequest.fromPartial({ context: req?.context });
    const { context: scope1, ...payload1 } = request1;
    const spread1 = { ...payload1, context: scope1 ?
      { ...scope1, baggage: { ...scope1.baggage } } : undefined };
    const invoke1: Unary<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse> =
      (input, done) => this.identityUserClient.batchGetUsers(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<identityUserServiceApi.BatchGetUsersRequest, identityUserServiceApi.BatchGetUsersResponse>(invoke1, spread1);
    const request2 = customersHouseholdQueryServiceApi.ExportHouseholdsRequest.fromPartial({
      context: req?.context,
      filter: { region: (req?.contentBlock?.location?.region ?? "") },
    });
    const stream2 = this.customersHouseholdQueryClient.exportHouseholds(request2, metadataFor(request2.context), { deadline: Date.now() + 15_000 });
    const messages2 = await collect(stream2);
    const reply2 = messages2.at(-1) ?? customersHouseholdQueryServiceApi.ExportHouseholdsResponse.fromPartial({});
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse.fromPartial({
        outcome: { status: (reply1?.result?.status ?? "") },
        result: { message: (reply1?.result?.message ?? "") },
      }),
      contentContentBlockWorkflowServiceApi.RetryContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          status: req?.contentBlock?.status,
        },
      }),
    );
  }

  /**
   * Starts a content block.
   */
  async startContentBlockWorkflow(req: contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowRequest): Promise<contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse> {
    validateContext(req.context);
    if (req.contentBlock) {
      await this.repository.save(toContentBlockRecord(req.context.tenantId, req.contentBlock));
    }
    await this.repository.record(req.context.tenantId, "StartContentBlockWorkflow", req);
    this.logger.info("start_content_block_workflow", { tenant: req.context.tenantId, trace: req.context.traceId });
    const { context: context1, ...body1 } = req;
    const input1 = { ...body1, context: context1 };
    const request1 = contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest.fromPartial({
      context: input1?.context,
      taxonomy: {
        children: [{
          children: [{
            audit: { etag: (input1?.contentBlock?.audit?.etag ?? "") },
            location: { recipient: (input1?.contentBlock?.location?.recipient ?? "") },
            manager: { email: (input1?.contentBlock?.manager?.email ?? "") },
          }],
          manager: { email: (input1?.details?.notify?.email ?? "") },
        }],
      },
    });
    const invoke1: Unary<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse> =
      (input, done) => this.contentTaxonomyCalculationClient.simulateTaxonomy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<contentTaxonomyCalculationServiceApi.SimulateTaxonomyRequest, contentTaxonomyCalculationServiceApi.SimulateTaxonomyResponse>(invoke1, request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          children: [{
            children: [{ depth: (reply1?.taxonomy?.depth ?? 0) }],
            manager: { email: (reply1?.taxonomy?.manager?.email ?? "") },
          }],
        },
      }),
      contentContentBlockWorkflowServiceApi.StartContentBlockWorkflowResponse.fromPartial({
        contentBlock: {
          contentBlockId: (req?.contentBlockId ?? ""),
          location: req?.contentBlock?.location,
        },
      }),
    );
  }
}
