import * as experimentsVariantValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_validation_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as personalizationRecommendationValidationServiceApi from "../../../.cache/proto/acme/personalization/v1/recommendation_validation_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relaySecretMessage keeps of each LookupSecret response. */
interface RelaySecretMessageRecord {
  message: string;
  secretId: string;
}

/** Where relaySecretMessage hands each record. */
interface RelaySecretMessageSink {
  send(record: RelaySecretMessageRecord): Promise<void>;
}

/** Passes records to acme.media.v1.TranscodeJobApprovalService. */
class RelaySecretMessageTranscodeJobApproval implements RelaySecretMessageSink {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelaySecretMessageRecord): Promise<void> {
    await call<mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest, mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalResponse>(
      (request, done) => this.client.commentTranscodeJobApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      mediaTranscodeJobApprovalServiceApi.CommentTranscodeJobApprovalRequest.fromPartial({ transcodeJobId: record.message, transcodeJob: { transcodeJobId: record.secretId } }));
  }
}

/** Writes records to acme.personalization.v1.RecommendationValidationService. */
class RelaySecretMessageRecommendationValidation implements RelaySecretMessageSink {
  private readonly client: personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationRecommendationValidationServiceApi.RecommendationValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelaySecretMessageRecord): Promise<void> {
    await retry(() => call<personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest, personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityResponse>(
      (request, done) => this.client.checkRecommendationEligibility(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      personalizationRecommendationValidationServiceApi.CheckRecommendationEligibilityRequest.fromPartial({ recommendation: { number: record.secretId }, details: { locale: record.message } })));
  }
}

/** Writes records to acme.experiments.v1.VariantValidationService. */
class RelaySecretMessageVariantValidation implements RelaySecretMessageSink {
  private readonly client: experimentsVariantValidationServiceApi.VariantValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantValidationServiceApi.VariantValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: RelaySecretMessageRecord): Promise<void> {
    await call<experimentsVariantValidationServiceApi.NormalizeVariantRequest, experimentsVariantValidationServiceApi.NormalizeVariantResponse>(
      (request, done) => this.client.normalizeVariant(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      experimentsVariantValidationServiceApi.NormalizeVariantRequest.fromPartial({ variant: { variantId: record.message, description: record.secretId } }));
  }
}

/** Reads acme.secrets.v1.SecretQueryService/LookupSecret and hands what it keeps to the sink of its kind. */
export async function relaySecretMessage(runtime: Runtime): Promise<void> {
  const source = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<secretsSecretQueryServiceApi.LookupSecretRequest, secretsSecretQueryServiceApi.LookupSecretResponse>(
    (request, done) => source.lookupSecret(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    secretsSecretQueryServiceApi.LookupSecretRequest.fromPartial({ secretId: "main-relay-secret-message" }));
  const row: RelaySecretMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    secretId: found.secret?.secretId ?? "",
  };
  const entries: Array<{ kind: string; sink: RelaySecretMessageSink }> = [
    { kind: "transcode-job-approval", sink: new RelaySecretMessageTranscodeJobApproval(runtime) },
    { kind: "recommendation-validation", sink: new RelaySecretMessageRecommendationValidation(runtime) },
    { kind: "variant-validation", sink: new RelaySecretMessageVariantValidation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "variant-validation") continue;
    await entry.sink.send(row);
  }
}
