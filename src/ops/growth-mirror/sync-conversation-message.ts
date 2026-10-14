import * as contentTaxonomyValidationServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_validation_service.js";
import * as formsFormSubmissionQueryServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_query_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import * as performanceReviewServiceApi from "../../../.cache/proto/acme/performance/v1/review_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncConversationMessage keeps of each ActivateConversation response. */
interface SyncConversationMessageRecord {
  message: string;
  status: string;
}

/** Where syncConversationMessage hands each record. */
interface SyncConversationMessageTarget {
  write(record: SyncConversationMessageRecord): Promise<void>;
}

/** Writes records to acme.content.v1.TaxonomyValidationService. */
class SyncConversationMessageTaxonomyValidation implements SyncConversationMessageTarget {
  private readonly client: contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentTaxonomyValidationServiceApi.TaxonomyValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncConversationMessageRecord): Promise<void> {
    await call<contentTaxonomyValidationServiceApi.PreviewTaxonomyRequest, contentTaxonomyValidationServiceApi.PreviewTaxonomyResponse>(
      (request, done) => this.client.previewTaxonomy(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      contentTaxonomyValidationServiceApi.PreviewTaxonomyRequest.fromPartial({ taxonomy: { parentId: record.status } }));
  }
}

/** Writes records to acme.performance.v1.ReviewService. */
class SyncConversationMessageReview implements SyncConversationMessageTarget {
  private readonly client: performanceReviewServiceApi.ReviewServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new performanceReviewServiceApi.ReviewServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncConversationMessageRecord): Promise<void> {
    await call<performanceReviewServiceApi.CloneReviewRequest, performanceReviewServiceApi.CloneReviewResponse>(
      (request, done) => this.client.cloneReview(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      performanceReviewServiceApi.CloneReviewRequest.fromPartial({ review: { reviewId: record.message } }));
  }
}

/** Sends records to acme.forms.v1.FormSubmissionQueryService. */
class SyncConversationMessageFormSubmissionQuery implements SyncConversationMessageTarget {
  private readonly client: formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionQueryServiceApi.FormSubmissionQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: SyncConversationMessageRecord): Promise<void> {
    await call<formsFormSubmissionQueryServiceApi.LookupFormSubmissionRequest, formsFormSubmissionQueryServiceApi.LookupFormSubmissionResponse>(
      (request, done) => this.client.lookupFormSubmission(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormSubmissionQueryServiceApi.LookupFormSubmissionRequest.fromPartial({ formSubmissionId: record.status }));
  }
}

/**
 * Reads acme.messaging.v1.ConversationLifecycleService/ActivateConversation and hands what it keeps to the
 * sink of its kind.
 */
export async function syncConversationMessage(runtime: Runtime): Promise<void> {
  const source = new messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<messagingConversationLifecycleServiceApi.ActivateConversationRequest, messagingConversationLifecycleServiceApi.ActivateConversationResponse>(
    (request, done) => source.activateConversation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingConversationLifecycleServiceApi.ActivateConversationRequest.fromPartial({ conversationId: "nightly-sync-conversation-message" })));
  const kept: SyncConversationMessageRecord = {
    message: reply.outcome?.message ?? "",
    status: reply.outcome?.status ?? "",
  };
  const sinks: SyncConversationMessageTarget[] = [
    new SyncConversationMessageTaxonomyValidation(runtime),
    new SyncConversationMessageReview(runtime),
    new SyncConversationMessageFormSubmissionQuery(runtime),
  ];
  await sinks[1]!.write(kept);
}
