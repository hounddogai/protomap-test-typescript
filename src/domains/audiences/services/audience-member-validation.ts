/**
 * Checks audience members against the rules before anything acts on them. Remote work stays behind typed client
 * ports.
 */

import * as audiencesAudienceMemberCalculationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceValidationServiceApi from "../../../../.cache/proto/acme/audiences/v1/audience_validation_service.js";
import * as authorizationAccessPolicyServiceApi from "../../../../.cache/proto/acme/authorization/v1/access_policy_service.js";
import * as communityForumValidationServiceApi from "../../../../.cache/proto/acme/community/v1/forum_validation_service.js";
import * as experimentsExperimentValidationServiceApi from "../../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as identityUserServiceApi from "../../../../.cache/proto/acme/identity/v1/user_service.js";
import * as ledgerLedgerAccountServiceApi from "../../../../.cache/proto/acme/ledger/v1/ledger_account_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as googleAnyApi from "../../../../.cache/proto/google/protobuf/any.js";
import { inRequest, validateContext } from "../../../platform/context.js";
import { RpcError, requireReply, serviceError } from "../../../platform/errors.js";
import { unary } from "../../../platform/handlers.js";
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
import { toAudienceMemberRecord } from "../data/records.js";
import { AudiencesRepository } from "../data/repository.js";
import { status, type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { promisify } from "node:util";
import { inject, injectable } from "tsyringe";

/**
 * Coordinate audience member operations and persist audit data.
 */
@injectable()
export class AudienceMemberValidationWorkflow {
  constructor(
    @inject(AudiencesRepository) private readonly repository: AudiencesRepository,
    @inject("logger") private readonly logger: Logger,
    @inject("grpc:acme.audiences.v1.AudienceMemberCalculationService") private readonly audiencesAudienceMemberCalculationClient: audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient,
    @inject("grpc:acme.audiences.v1.AudienceValidationService") private readonly audiencesAudienceValidationClient: audiencesAudienceValidationServiceApi.AudienceValidationServiceClient,
    @inject("grpc:acme.authorization.v1.AccessPolicyService") private readonly authorizationAccessPolicyClient: authorizationAccessPolicyServiceApi.AccessPolicyServiceClient,
    @inject("grpc:acme.community.v1.ForumValidationService") private readonly communityForumValidationClient: communityForumValidationServiceApi.ForumValidationServiceClient,
    @inject("grpc:acme.experiments.v1.ExperimentValidationService") private readonly experimentsExperimentValidationClient: experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient,
    @inject("grpc:acme.identity.v1.UserService") private readonly identityUserClient: identityUserServiceApi.UserServiceClient,
    @inject("grpc:acme.ledger.v1.LedgerAccountService") private readonly ledgerLedgerAccountClient: ledgerLedgerAccountServiceApi.LedgerAccountServiceClient,
    @inject("grpc:acme.maintenance.v1.WorkOrderCalculationService") private readonly maintenanceWorkOrderCalculationClient: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient,
    @inject("grpc:acme.search.v1.SearchIndexQueryService") private readonly searchSearchIndexQueryClient: searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient,
    @inject("clients") private readonly clients: ClientRegistry,
    @inject("workQueue") private readonly workQueue: WorkQueue
  ) {}

  /**
   * Explains an audience member.
   */
  async explainAudienceMemberDecision(req: audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest): Promise<audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ExplainAudienceMemberDecision", req);
    this.logger.info("explain_audience_member_decision", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest.fromPartial({
      context: req?.context,
      filter: {
        createdAfter: req?.audienceMember?.audit?.createdAt,
        region: (req?.audienceMember?.primaryAddress?.region ?? ""),
      },
    });
    const cloned1: searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest = JSON.parse(JSON.stringify(request1));
    const invoke1: Unary<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse> =
      (input, done) => this.searchSearchIndexQueryClient.browseSearchIndexes(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await call<searchSearchIndexQueryServiceApi.BrowseSearchIndexesRequest, searchSearchIndexQueryServiceApi.BrowseSearchIndexesResponse>(invoke1, cloned1);
    const request2 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      audience: { audit: { updatedAt: req?.audienceMember?.audit?.updatedAt } },
      context: req?.context,
      details: {
        contact: {
          email: (req?.audienceMember?.contact?.email ?? ""),
          name: req?.details?.contact?.name,
          preferredChannel: (req?.audienceMember?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const decoded2 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromJSON(
      JSON.parse(JSON.stringify(audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.toJSON(request2))),
    );
    const invoke2: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse>(invoke2, decoded2);
    const request3 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
      audience: {
        action: { $case: "route", route: {
          target: ((reply2?.audience?.action?.$case === "route" ? reply2?.audience?.action.route : undefined)?.target ?? ""),
        } },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.details?.contact?.email ?? ""),
          name: req?.audienceMember?.contact?.name,
        },
      },
    });
    const envelope3 = googleAnyApi.Any.fromPartial({
      typeUrl: "type.googleapis.com/acme.audiences.v1.CheckAudienceEligibilityRequest",
      value: Buffer.from(audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.encode(request3).finish()),
    });
    const unpacked3 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.decode(envelope3.value);
    const invoke3: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
      (input, done) => this.audiencesAudienceValidationClient.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await call<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(invoke3, unpacked3);
    const request4 = communityForumValidationServiceApi.ValidateForumRequest.fromPartial({
      context: req?.context,
      forum: {
        children: [{
          children: [{
            manager: {
              displayName: (reply3?.audience?.owner?.displayName ?? ""),
              userId: (reply2?.audience?.owner?.userId ?? ""),
            },
          }],
        }],
      },
    });
    const client4 = this.clients.get<communityForumValidationServiceApi.ForumValidationServiceClient>("acme.community.v1.ForumValidationService");
    const invoke4: Unary<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse> =
      (input, done) => client4.validateForum(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply4 = await call<communityForumValidationServiceApi.ValidateForumRequest, communityForumValidationServiceApi.ValidateForumResponse>(invoke4, request4);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse.fromPartial({ result: { correlationId: (reply1?.result?.correlationId ?? "") } }),
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse.fromPartial({ result: { status: (reply2?.result?.status ?? "") } }),
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse.fromPartial({ result: { message: (reply3?.result?.message ?? "") } }),
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse.fromPartial({
        audienceMember: {
          audit: { updatedBy: (reply4?.forum?.audit?.updatedBy ?? "") },
          contact: { email: (reply4?.forum?.manager?.email ?? "") },
        },
      }),
      audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: { name: req?.audienceMember?.name },
        },
      }),
    );
  }

  /**
   * Returns an audience member.
   */
  async getAudienceMemberRules(req: audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest): Promise<audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse> {
    validateContext(req.context);
    if (!req.audienceMemberId.trim()) {
      throw new RpcError(status.INVALID_ARGUMENT, "audience_member_id is required");
    }
    await this.repository.record(req.context.tenantId, "GetAudienceMemberRules", req);
    this.logger.info("get_audience_member_rules", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest.fromPartial({
      context: req?.context,
      ledgerAccount: {
        audit: { createdAt: req?.context?.deadline },
        contact: { email: (req?.context?.actor?.email ?? "") },
        funding: { $case: "externalAccountId", externalAccountId: (req?.audienceMemberId ?? "") },
        labels: Object.fromEntries(Object.entries((req?.context?.baggage ?? {}))),
      },
    });
    const invoke1: Unary<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> =
      (input, done) => this.ledgerLedgerAccountClient.cloneLedgerAccount(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const port1: RequestPort<ledgerLedgerAccountServiceApi.CloneLedgerAccountRequest, ledgerLedgerAccountServiceApi.CloneLedgerAccountResponse> = new GrpcAdapter(invoke1);
    const reply1 = await port1.execute(request1);
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse.fromPartial({
        audienceMember: { audit: { createdAt: reply1?.ledgerAccount?.audit?.createdAt } },
      }),
      audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse.fromPartial({ audienceMember: { audienceMemberId: (req?.audienceMemberId ?? "") } }),
    );
  }

  /**
   * Lints an audience member.
   */
  async lintAudienceMembers(req: audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest): Promise<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "LintAudienceMembers", req);
    this.logger.info("lint_audience_members", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({
      context: req?.context,
      experiment: {
        participants: [{
          contact: { email: (req?.audienceMember?.relationshipManager?.email ?? "") },
        }],
      },
    });
    const invoke1: Unary<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse> =
      (input, done) => this.experimentsExperimentValidationClient.checkExperimentEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply1 = await retry(() => call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(invoke1, request1));
    const request2 = authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest.fromPartial({
      accessPolicy: {
        audit: {
          createdBy: (req?.audienceMember?.audit?.createdBy ?? ""),
          etag: (req?.audienceMember?.audit?.etag ?? ""),
        },
      },
      context: req?.context,
    });
    const invoke2: Unary<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse> =
      (input, done) => this.authorizationAccessPolicyClient.updateAccessPolicy(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await workflow("LintAudienceMembers.UpdateAccessPolicy", () => call<authorizationAccessPolicyServiceApi.UpdateAccessPolicyRequest, authorizationAccessPolicyServiceApi.UpdateAccessPolicyResponse>(invoke2, request2));
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse.fromPartial({
        audienceMember: {
          primaryAddress: { recipient: (reply1?.experiment?.location?.recipient ?? "") },
        },
        outcome: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse.fromPartial({
        audienceMember: { audit: { etag: (reply2?.accessPolicy?.audit?.etag ?? "") } },
        result: { correlationId: (reply2?.result?.correlationId ?? "") },
      }),
      audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: req?.details?.contact,
        },
      }),
    );
  }

  /**
   * Normalizes an audience member.
   */
  async normalizeAudienceMember(req: audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest): Promise<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "NormalizeAudienceMember", req);
    this.logger.info("normalize_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = identityUserServiceApi.GetUserRequest.fromPartial({
      context: req?.context,
      userId: (req?.audienceMember?.relationshipManager?.userId ?? ""),
    });
    const invoke1: Unary<identityUserServiceApi.GetUserRequest, identityUserServiceApi.GetUserResponse> =
      (input, done) => this.identityUserClient.getUser(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const task1 = operation(invoke1)(request1);
    const reply1 = await task1();
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { updatedBy: (reply1?.user?.audit?.updatedBy ?? "") } },
      }),
      audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Previews an audience member.
   */
  async previewAudienceMember(req: audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest): Promise<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "PreviewAudienceMember", req);
    this.logger.info("preview_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.LintAudiencesRequest.fromPartial({
      audience: {
        audit: { createdBy: (req?.audienceMember?.audit?.createdBy ?? "") },
        owner: { email: (req?.details?.contact?.email ?? "") },
      },
      context: req?.context,
      details: {
        contact: { email: (req?.audienceMember?.relationshipManager?.email ?? "") },
      },
    });
    const reply1 = await this.workQueue.enqueue<audiencesAudienceValidationServiceApi.LintAudiencesRequest, audiencesAudienceValidationServiceApi.LintAudiencesResponse>(
      "acme.audiences.v1.AudienceMemberValidationService/PreviewAudienceMember:0", request1,
    );
    const request2 = audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest.fromPartial({
      context: req?.context,
      details: {
        contact: {
          preferredChannel: (req?.audienceMember?.contact?.preferredChannel ?? ""),
        },
      },
    });
    const invoke2: Unary<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse> =
      (input, done) => this.audiencesAudienceValidationClient.checkAudienceEligibility(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await inRequest(req.context!, () => call<audiencesAudienceValidationServiceApi.CheckAudienceEligibilityRequest, audiencesAudienceValidationServiceApi.CheckAudienceEligibilityResponse>(invoke2, request2));
    const request3 = maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersRequest.fromPartial({
      context: req?.context,
      workOrder: {
        assignee: { displayName: (reply2?.audience?.owner?.displayName ?? "") },
      },
    });
    const invoke3: Unary<maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersRequest, maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersResponse> =
      (input, done) => this.maintenanceWorkOrderCalculationClient.recalculateWorkOrders(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply3 = await new Promise<maintenanceWorkOrderCalculationServiceApi.RecalculateWorkOrdersResponse>((resolve, reject) => {
      invoke3(request3, (error, result) => {
        if (error) { reject(error); return; }
        try { resolve(requireReply(result)); } catch (failure) { reject(failure); }
      });
    });
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { updatedBy: (reply1?.audience?.audit?.updatedBy ?? "") } },
        result: { status: (reply1?.result?.status ?? "") },
      }),
      audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse.fromPartial({ outcome: { message: (reply2?.result?.message ?? "") } }),
      audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { etag: (reply3?.workOrder?.audit?.etag ?? "") } },
        result: { message: (reply3?.result?.message ?? "") },
      }),
      audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }

  /**
   * Scores an audience member.
   */
  async scoreAudienceMember(req: audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest): Promise<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ScoreAudienceMember", req);
    this.logger.info("score_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest.fromPartial({
      audienceMemberId: (req?.audienceMember?.audienceMemberId ?? ""),
      context: req?.context,
    });
    const invoke1: Unary<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest, audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse> =
      (input, done) => this.audiencesAudienceMemberCalculationClient.getAudienceMemberRates(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const send1 = promised(invoke1);
    const reply1 = await send1(request1);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse.fromPartial({
        audienceMember: {
          name: reply1?.audienceMember?.contact?.name,
          relationshipManager: { email: (reply1?.audienceMember?.relationshipManager?.email ?? "") },
        },
      }),
      audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          contact: req?.audienceMember?.contact,
        },
      }),
    );
  }

  /**
   * Validates an audience member.
   */
  async validateAudienceMember(req: audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberRequest): Promise<audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse> {
    validateContext(req.context);
    if (req.audienceMember) {
      await this.repository.save(toAudienceMemberRecord(req.context.tenantId, req.audienceMember));
    }
    await this.repository.record(req.context.tenantId, "ValidateAudienceMember", req);
    this.logger.info("validate_audience_member", { tenant: req.context.tenantId, trace: req.context.traceId });
    const request1 = audiencesAudienceValidationServiceApi.NormalizeAudienceRequest.fromPartial({
      context: req?.context,
      details: { contact: { phone: (req?.audienceMember?.contact?.phone ?? "") } },
    });
    const invoke1: Unary<audiencesAudienceValidationServiceApi.NormalizeAudienceRequest, audiencesAudienceValidationServiceApi.NormalizeAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient.normalizeAudience(input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const asyncInvoke1 = promisify(invoke1);
    const reply1 = requireReply(await asyncInvoke1(request1));
    const request2 = audiencesAudienceValidationServiceApi.ValidateAudienceRequest.fromPartial({
      audience: {
        audit: { createdBy: (reply1?.audience?.audit?.createdBy ?? "") },
        owner: {
          displayName: (req?.audienceMember?.relationshipManager?.displayName ?? ""),
        },
      },
      context: req?.context,
      details: {
        contact: {
          email: (req?.audienceMember?.relationshipManager?.email ?? ""),
          phone: (req?.details?.contact?.phone ?? ""),
        },
      },
    });
    const method2 = "validateAudience" as const;
    const invoke2: Unary<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse> =
      (input, done) => this.audiencesAudienceValidationClient[method2](input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done);
    const reply2 = await call<audiencesAudienceValidationServiceApi.ValidateAudienceRequest, audiencesAudienceValidationServiceApi.ValidateAudienceResponse>(invoke2, request2);
    this.logger.info("local_audit", { value: (req?.reason ?? "") });
    return mergeResponses(
      audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse.fromPartial({
        audienceMember: { audit: { createdAt: reply1?.audience?.audit?.createdAt } },
      }),
      audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse.fromPartial({
        result: {
          correlationId: (reply2?.result?.correlationId ?? ""),
          status: (reply2?.result?.status ?? ""),
        },
      }),
      audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse.fromPartial({
        audienceMember: {
          audienceMemberId: (req?.audienceMemberId ?? ""),
          status: req?.audienceMember?.status,
        },
      }),
    );
  }
}

/**
 * The gRPC boundary for AudienceMemberValidationService; workflows own validation and database transactions.
 */
@injectable()
export class AudienceMemberValidationHandler {
  constructor(@inject(AudienceMemberValidationWorkflow) private readonly workflow: AudienceMemberValidationWorkflow) {}

  /**
   * Explains an audience member.
   */
  explainAudienceMemberDecision = unary<audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionRequest, audiencesAudienceMemberValidationServiceApi.ExplainAudienceMemberDecisionResponse>(
    (request) => this.workflow.explainAudienceMemberDecision(request),
  );

  /**
   * Returns an audience member.
   */
  getAudienceMemberRules = unary<audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest, audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse>(
    (request) => this.workflow.getAudienceMemberRules(request),
  );

  /**
   * Lints an audience member.
   */
  lintAudienceMembers = (call: ServerUnaryCall<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersRequest, audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse>, done: sendUnaryData<audiencesAudienceMemberValidationServiceApi.LintAudienceMembersResponse>): void => {
    void this.workflow.lintAudienceMembers(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Normalizes an audience member.
   */
  normalizeAudienceMember = unary<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse>(
    (request) => this.workflow.normalizeAudienceMember(request),
  );

  /**
   * Previews an audience member.
   */
  previewAudienceMember = unary<audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.PreviewAudienceMemberResponse>(
    (request) => this.workflow.previewAudienceMember(request),
  );

  /**
   * Scores an audience member.
   */
  scoreAudienceMember = (call: ServerUnaryCall<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse>, done: sendUnaryData<audiencesAudienceMemberValidationServiceApi.ScoreAudienceMemberResponse>): void => {
    void this.workflow.scoreAudienceMember(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Validates an audience member.
   */
  validateAudienceMember = unary<audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.ValidateAudienceMemberResponse>(
    (request) => this.workflow.validateAudienceMember(request),
  );
}

export function implementation(handler: AudienceMemberValidationHandler): audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceServer {
  return {
    explainAudienceMemberDecision: handler.explainAudienceMemberDecision,
    getAudienceMemberRules: handler.getAudienceMemberRules,
    lintAudienceMembers: handler.lintAudienceMembers,
    normalizeAudienceMember: handler.normalizeAudienceMember,
    previewAudienceMember: handler.previewAudienceMember,
    scoreAudienceMember: handler.scoreAudienceMember,
    validateAudienceMember: handler.validateAudienceMember,
  };
}
