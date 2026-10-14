import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as experimentsExposureWorkflowServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_workflow_service.js";
import * as featureflagsFeatureFlagQueryServiceApi from "../../../.cache/proto/acme/featureflags/v1/feature_flag_query_service.js";
import * as localizationTranslationJobLifecycleServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_lifecycle_service.js";
import * as personalizationRecommendationLifecycleServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardTranslationJobLifecycleSubject keeps of each GetTranslationJobLifecycle response. */
interface ForwardTranslationJobLifecycleSubjectRecord {
  subject: string;
  translationJobId: string;
}

/** Where forwardTranslationJobLifecycleSubject hands each record. */
interface ForwardTranslationJobLifecycleSubjectWriter {
  send(record: ForwardTranslationJobLifecycleSubjectRecord): Promise<void>;
}

/** Passes records to acme.community.v1.ForumApprovalService. */
class ForwardTranslationJobLifecycleSubjectForumApproval implements ForwardTranslationJobLifecycleSubjectWriter {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardTranslationJobLifecycleSubjectRecord): Promise<void> {
    await call<communityForumApprovalServiceApi.DelegateForumApprovalRequest, communityForumApprovalServiceApi.DelegateForumApprovalResponse>(
      (request, done) => this.client.delegateForumApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityForumApprovalServiceApi.DelegateForumApprovalRequest.fromPartial({ details: { comment: record.translationJobId } }));
  }
}

/** Passes records to acme.experiments.v1.ExposureWorkflowService. */
class ForwardTranslationJobLifecycleSubjectExposureWorkflow implements ForwardTranslationJobLifecycleSubjectWriter {
  private readonly client: experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureWorkflowServiceApi.ExposureWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardTranslationJobLifecycleSubjectRecord): Promise<void> {
    await call<experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest, experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowResponse>(
      (request, done) => this.client.resumeExposureWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      experimentsExposureWorkflowServiceApi.ResumeExposureWorkflowRequest.fromPartial({ exposure: { kind: record.translationJobId } }));
  }
}

/** Sends records to acme.personalization.v1.RecommendationLifecycleService. */
class ForwardTranslationJobLifecycleSubjectRecommendationLifecycle implements ForwardTranslationJobLifecycleSubjectWriter {
  private readonly client: personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationLifecycleServiceApi.RecommendationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardTranslationJobLifecycleSubjectRecord): Promise<void> {
    await call<personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest, personalizationRecommendationLifecycleServiceApi.ExpireRecommendationResponse>(
      (request, done) => this.client.expireRecommendation(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      personalizationRecommendationLifecycleServiceApi.ExpireRecommendationRequest.fromPartial({ recommendationId: record.translationJobId }));
  }
}

/** Hands records to acme.featureflags.v1.FeatureFlagQueryService. */
class ForwardTranslationJobLifecycleSubjectFeatureFlagQuery implements ForwardTranslationJobLifecycleSubjectWriter {
  private readonly client: featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new featureflagsFeatureFlagQueryServiceApi.FeatureFlagQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: ForwardTranslationJobLifecycleSubjectRecord): Promise<void> {
    await call<featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest, featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsResponse>(
      (request, done) => this.client.countFeatureFlags(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      featureflagsFeatureFlagQueryServiceApi.CountFeatureFlagsRequest.fromPartial({ filter: { query: record.subject } }));
  }
}

/**
 * Reads acme.localization.v1.TranslationJobLifecycleService/GetTranslationJobLifecycle and hands what it
 * keeps to the sink of its kind.
 */
export async function forwardTranslationJobLifecycleSubject(runtime: Runtime): Promise<void> {
  const upstream = new localizationTranslationJobLifecycleServiceApi.TranslationJobLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest, localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleResponse>(
    (request, done) => upstream.getTranslationJobLifecycle(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationTranslationJobLifecycleServiceApi.GetTranslationJobLifecycleRequest.fromPartial({ translationJobId: "nightly-forward-translation-job-lifecycle-subject" })));
  const row: ForwardTranslationJobLifecycleSubjectRecord = {
    subject: current.translationJob?.subject ?? "",
    translationJobId: current.translationJob?.translationJobId ?? "",
  };
  const entries: Array<{ kind: string; sink: ForwardTranslationJobLifecycleSubjectWriter }> = [
    { kind: "forum-approval", sink: new ForwardTranslationJobLifecycleSubjectForumApproval(runtime) },
    { kind: "exposure-workflow", sink: new ForwardTranslationJobLifecycleSubjectExposureWorkflow(runtime) },
    { kind: "recommendation-lifecycle", sink: new ForwardTranslationJobLifecycleSubjectRecommendationLifecycle(runtime) },
    { kind: "feature-flag-query", sink: new ForwardTranslationJobLifecycleSubjectFeatureFlagQuery(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "forum-approval") continue;
    await entry.sink.send(row);
  }
}
