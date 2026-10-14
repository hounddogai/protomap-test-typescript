import * as documentsDocumentValidationServiceApi from "../../../.cache/proto/acme/documents/v1/document_validation_service.js";
import * as personalizationAffinityReportingServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_reporting_service.js";
import * as searchSearchIndexValidationServiceApi from "../../../.cache/proto/acme/search/v1/search_index_validation_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyDocumentEligibilityNumber keeps of each CheckDocumentEligibility response. */
interface CopyDocumentEligibilityNumberRecord {
  number: string;
  status: string;
  correlationId: string;
  notes: string;
}

/** Where copyDocumentEligibilityNumber hands each record. */
interface CopyDocumentEligibilityNumberWriter {
  push(record: CopyDocumentEligibilityNumberRecord): Promise<void>;
}

/** Passes records to acme.personalization.v1.AffinityReportingService. */
class CopyDocumentEligibilityNumberAffinityReporting implements CopyDocumentEligibilityNumberWriter {
  private readonly client: personalizationAffinityReportingServiceApi.AffinityReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new personalizationAffinityReportingServiceApi.AffinityReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyDocumentEligibilityNumberRecord): Promise<void> {
    await retry(() => call<personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest, personalizationAffinityReportingServiceApi.GenerateAffinityReportResponse>(
      (request, done) => this.client.generateAffinityReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      personalizationAffinityReportingServiceApi.GenerateAffinityReportRequest.fromPartial({ details: { cron: record.correlationId } })));
  }
}

/** Passes records to acme.secrets.v1.SecretQueryService. */
class CopyDocumentEligibilityNumberSecretQuery implements CopyDocumentEligibilityNumberWriter {
  private readonly client: secretsSecretQueryServiceApi.SecretQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyDocumentEligibilityNumberRecord): Promise<void> {
    await retry(() => call<secretsSecretQueryServiceApi.SummarizeSecretsRequest, secretsSecretQueryServiceApi.SummarizeSecretsResponse>(
      (request, done) => this.client.summarizeSecrets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      secretsSecretQueryServiceApi.SummarizeSecretsRequest.fromPartial({ details: { cron: record.notes, format: record.number }, secretId: record.correlationId })));
  }
}

/** Passes records to acme.search.v1.SearchIndexValidationService. */
class CopyDocumentEligibilityNumberSearchIndexValidation implements CopyDocumentEligibilityNumberWriter {
  private readonly client: searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexValidationServiceApi.SearchIndexValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyDocumentEligibilityNumberRecord): Promise<void> {
    await call<searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest, searchSearchIndexValidationServiceApi.ScoreSearchIndexResponse>(
      (request, done) => this.client.scoreSearchIndex(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      searchSearchIndexValidationServiceApi.ScoreSearchIndexRequest.fromPartial({ details: { currencyCode: record.notes } }));
  }
}

/** Passes records to acme.surveys.v1.SurveyApprovalService. */
class CopyDocumentEligibilityNumberSurveyApproval implements CopyDocumentEligibilityNumberWriter {
  private readonly client: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CopyDocumentEligibilityNumberRecord): Promise<void> {
    await retry(() => call<surveysSurveyApprovalServiceApi.RecallSurveyRequest, surveysSurveyApprovalServiceApi.RecallSurveyResponse>(
      (request, done) => this.client.recallSurvey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      surveysSurveyApprovalServiceApi.RecallSurveyRequest.fromPartial({ survey: { notes: record.status } })));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyDocumentEligibilityNumber(kind: string, record: CopyDocumentEligibilityNumberRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "affinity-reporting": () => new CopyDocumentEligibilityNumberAffinityReporting(runtime).push(record),
    "secret-query": () => new CopyDocumentEligibilityNumberSecretQuery(runtime).push(record),
    "search-index-validation": () => new CopyDocumentEligibilityNumberSearchIndexValidation(runtime).push(record),
    "survey-approval": () => new CopyDocumentEligibilityNumberSurveyApproval(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.documents.v1.DocumentValidationService/CheckDocumentEligibility and hands what it keeps to the
 * sink of its kind.
 */
export async function copyDocumentEligibilityNumber(runtime: Runtime): Promise<void> {
  const upstream = new documentsDocumentValidationServiceApi.DocumentValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<documentsDocumentValidationServiceApi.CheckDocumentEligibilityRequest, documentsDocumentValidationServiceApi.CheckDocumentEligibilityResponse>(
    (request, done) => upstream.checkDocumentEligibility(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    documentsDocumentValidationServiceApi.CheckDocumentEligibilityRequest.fromPartial({ documentId: "nightly-copy-document-eligibility-number" })));
  const entry: CopyDocumentEligibilityNumberRecord = {
    number: text.normalize(found.document?.number ?? ""),
    status: found.result?.status ?? "",
    correlationId: found.result?.correlationId ?? "",
    notes: text.normalize(found.document?.notes ?? ""),
  };
  await actOnCopyDocumentEligibilityNumber("secret-query", entry, runtime);
}
