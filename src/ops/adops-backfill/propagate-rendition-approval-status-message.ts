import * as communityBadgeLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/badge_lifecycle_service.js";
import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as formsFormApprovalServiceApi from "../../../.cache/proto/acme/forms/v1/form_approval_service.js";
import * as mediaRenditionApprovalServiceApi from "../../../.cache/proto/acme/media/v1/rendition_approval_service.js";
import * as sponsorshipsSponsorServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateRenditionApprovalStatusMessage keeps of each GetRenditionApprovalStatus response. */
interface PropagateRenditionApprovalStatusMessageRecord {
  message: string;
  renditionId: string;
  correlationId: string;
}

/** Where propagateRenditionApprovalStatusMessage hands each record. */
interface PropagateRenditionApprovalStatusMessageWriter {
  deliver(record: PropagateRenditionApprovalStatusMessageRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormApprovalService. */
class PropagateRenditionApprovalStatusMessageFormApproval implements PropagateRenditionApprovalStatusMessageWriter {
  private readonly client: formsFormApprovalServiceApi.FormApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormApprovalServiceApi.FormApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateRenditionApprovalStatusMessageRecord): Promise<void> {
    await call<formsFormApprovalServiceApi.CommentFormApprovalRequest, formsFormApprovalServiceApi.CommentFormApprovalResponse>(
      (request, done) => this.client.commentFormApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormApprovalServiceApi.CommentFormApprovalRequest.fromPartial({ form: { number: record.message }, details: { approverEmail: record.correlationId } }));
  }
}

/** Hands records to acme.community.v1.BadgeLifecycleService. */
class PropagateRenditionApprovalStatusMessageBadgeLifecycle implements PropagateRenditionApprovalStatusMessageWriter {
  private readonly client: communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeLifecycleServiceApi.BadgeLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateRenditionApprovalStatusMessageRecord): Promise<void> {
    await retry(() => call<communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest, communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryResponse>(
      (request, done) => this.client.scheduleBadgeExpiry(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityBadgeLifecycleServiceApi.ScheduleBadgeExpiryRequest.fromPartial({ badge: { description: record.message } })));
  }
}

/** Sends records to acme.community.v1.PostValidationService. */
class PropagateRenditionApprovalStatusMessagePostValidation implements PropagateRenditionApprovalStatusMessageWriter {
  private readonly client: communityPostValidationServiceApi.PostValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostValidationServiceApi.PostValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateRenditionApprovalStatusMessageRecord): Promise<void> {
    await call<communityPostValidationServiceApi.GetPostRulesRequest, communityPostValidationServiceApi.GetPostRulesResponse>(
      (request, done) => this.client.getPostRules(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityPostValidationServiceApi.GetPostRulesRequest.fromPartial({ postId: record.renditionId }));
  }
}

/** Sends records to acme.sponsorships.v1.SponsorService. */
class PropagateRenditionApprovalStatusMessageSponsor implements PropagateRenditionApprovalStatusMessageWriter {
  private readonly client: sponsorshipsSponsorServiceApi.SponsorServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sponsorshipsSponsorServiceApi.SponsorServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateRenditionApprovalStatusMessageRecord): Promise<void> {
    await call<sponsorshipsSponsorServiceApi.DeleteSponsorRequest, sponsorshipsSponsorServiceApi.DeleteSponsorResponse>(
      (request, done) => this.client.deleteSponsor(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      sponsorshipsSponsorServiceApi.DeleteSponsorRequest.fromPartial({ reason: record.renditionId }));
  }
}

/**
 * Reads acme.media.v1.RenditionApprovalService/GetRenditionApprovalStatus and hands what it keeps to the sink
 * of its kind.
 */
export async function propagateRenditionApprovalStatusMessage(runtime: Runtime): Promise<void> {
  const upstream = new mediaRenditionApprovalServiceApi.RenditionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusRequest, mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusResponse>(
    (request, done) => upstream.getRenditionApprovalStatus(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaRenditionApprovalServiceApi.GetRenditionApprovalStatusRequest.fromPartial({ renditionId: "primary-propagate-rendition-approval-status-message" }));
  const kept: PropagateRenditionApprovalStatusMessageRecord = {
    message: found.result?.message ?? "",
    renditionId: found.rendition?.renditionId ?? "",
    correlationId: found.result?.correlationId ?? "",
  };
  const sinks: PropagateRenditionApprovalStatusMessageWriter[] = [
    new PropagateRenditionApprovalStatusMessageFormApproval(runtime),
    new PropagateRenditionApprovalStatusMessageBadgeLifecycle(runtime),
    new PropagateRenditionApprovalStatusMessagePostValidation(runtime),
    new PropagateRenditionApprovalStatusMessageSponsor(runtime),
  ];
  await sinks[0]!.deliver(kept);
}
