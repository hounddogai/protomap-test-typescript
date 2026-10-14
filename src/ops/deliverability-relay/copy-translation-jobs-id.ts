import * as chatHandoffReportingServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as localizationTranslationJobValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as mediaRenditionValidationServiceApi from "../../../.cache/proto/acme/media/v1/rendition_validation_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyTranslationJobsId keeps of each LintTranslationJobs response. */
interface CopyTranslationJobsIdRecord {
  referenceId: string;
  status: string;
}

/** Where copyTranslationJobsId hands each record. */
interface CopyTranslationJobsIdSink {
  forward(record: CopyTranslationJobsIdRecord): Promise<void>;
}

/** Hands records to acme.chat.v1.HandoffReportingService. */
class CopyTranslationJobsIdHandoffReporting implements CopyTranslationJobsIdSink {
  private readonly client: chatHandoffReportingServiceApi.HandoffReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffReportingServiceApi.HandoffReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyTranslationJobsIdRecord): Promise<void> {
    await call<chatHandoffReportingServiceApi.CountHandoffTotalsRequest, chatHandoffReportingServiceApi.CountHandoffTotalsResponse>(
      (request, done) => this.client.countHandoffTotals(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      chatHandoffReportingServiceApi.CountHandoffTotalsRequest.fromPartial({ orderBy: record.referenceId, page: { pageToken: record.status } }));
  }
}

/** Sends records to acme.suppliers.v1.SupplierQueryService. */
class CopyTranslationJobsIdSupplierQuery implements CopyTranslationJobsIdSink {
  private readonly client: suppliersSupplierQueryServiceApi.SupplierQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new suppliersSupplierQueryServiceApi.SupplierQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyTranslationJobsIdRecord): Promise<void> {
    await call<suppliersSupplierQueryServiceApi.PeekSupplierRequest, suppliersSupplierQueryServiceApi.PeekSupplierResponse>(
      (request, done) => this.client.peekSupplier(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      suppliersSupplierQueryServiceApi.PeekSupplierRequest.fromPartial({ supplierId: record.referenceId }));
  }
}

/** Writes records to acme.media.v1.RenditionValidationService. */
class CopyTranslationJobsIdRenditionValidation implements CopyTranslationJobsIdSink {
  private readonly client: mediaRenditionValidationServiceApi.RenditionValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaRenditionValidationServiceApi.RenditionValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyTranslationJobsIdRecord): Promise<void> {
    await retry(() => call<mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest, mediaRenditionValidationServiceApi.ExplainRenditionDecisionResponse>(
      (request, done) => this.client.explainRenditionDecision(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaRenditionValidationServiceApi.ExplainRenditionDecisionRequest.fromPartial({ rendition: { code: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class CopyTranslationJobsIdLogOnly implements CopyTranslationJobsIdSink {
  async forward(record: CopyTranslationJobsIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverCopyTranslationJobsId(kind: string, record: CopyTranslationJobsIdRecord, runtime: Runtime): Promise<void> {
  let sink: CopyTranslationJobsIdSink = new CopyTranslationJobsIdLogOnly();
  switch (kind) {
    case "handoff-reporting":
      sink = new CopyTranslationJobsIdHandoffReporting(runtime);
      break;
    case "supplier-query":
      sink = new CopyTranslationJobsIdSupplierQuery(runtime);
      break;
    case "rendition-validation":
      sink = new CopyTranslationJobsIdRenditionValidation(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.localization.v1.TranslationJobValidationService/LintTranslationJobs and hands what it keeps to
 * the sink of its kind.
 */
export async function copyTranslationJobsId(runtime: Runtime): Promise<void> {
  const reader = new localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest, localizationTranslationJobValidationServiceApi.LintTranslationJobsResponse>(
    (request, done) => reader.lintTranslationJobs(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    localizationTranslationJobValidationServiceApi.LintTranslationJobsRequest.fromPartial({ reason: "primary-copy-translation-jobs-id" })));
  const record: CopyTranslationJobsIdRecord = {
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
    status: text.normalize(response.result?.status ?? ""),
  };
  await deliverCopyTranslationJobsId("supplier-query", record, runtime);
}
