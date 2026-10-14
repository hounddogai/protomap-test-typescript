import * as catalogProductCalculationServiceApi from "../../../.cache/proto/acme/catalog/v1/product_calculation_service.js";
import * as communityModerationLifecycleServiceApi from "../../../.cache/proto/acme/community/v1/moderation_lifecycle_service.js";
import * as complianceComplianceCaseCalculationServiceApi from "../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryTranscodeJobStatus keeps of each EscalateTranscodeJob response. */
interface CarryTranscodeJobStatusRecord {
  status: string;
  message: string;
}

/** Where carryTranscodeJobStatus hands each record. */
interface CarryTranscodeJobStatusWriter {
  send(record: CarryTranscodeJobStatusRecord): Promise<void>;
}

/** Passes records to acme.community.v1.ModerationLifecycleService. */
class CarryTranscodeJobStatusModerationLifecycle implements CarryTranscodeJobStatusWriter {
  private readonly client: communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityModerationLifecycleServiceApi.ModerationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryTranscodeJobStatusRecord): Promise<void> {
    await retry(() => call<communityModerationLifecycleServiceApi.ReinstateModerationRequest, communityModerationLifecycleServiceApi.ReinstateModerationResponse>(
      (request, done) => this.client.reinstateModeration(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      communityModerationLifecycleServiceApi.ReinstateModerationRequest.fromPartial({ moderationId: record.message })));
  }
}

/** Hands records to acme.catalog.v1.ProductCalculationService. */
class CarryTranscodeJobStatusProductCalculation implements CarryTranscodeJobStatusWriter {
  private readonly client: catalogProductCalculationServiceApi.ProductCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new catalogProductCalculationServiceApi.ProductCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryTranscodeJobStatusRecord): Promise<void> {
    await retry(() => call<catalogProductCalculationServiceApi.EstimateProductRequest, catalogProductCalculationServiceApi.EstimateProductResponse>(
      (request, done) => this.client.estimateProduct(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      catalogProductCalculationServiceApi.EstimateProductRequest.fromPartial({ reason: record.message, product: { productId: record.status } })));
  }
}

/** Passes records to acme.compliance.v1.ComplianceCaseCalculationService. */
class CarryTranscodeJobStatusComplianceCaseCalculation implements CarryTranscodeJobStatusWriter {
  private readonly client: complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryTranscodeJobStatusRecord): Promise<void> {
    await retry(() => call<complianceComplianceCaseCalculationServiceApi.GetComplianceCaseRatesRequest, complianceComplianceCaseCalculationServiceApi.GetComplianceCaseRatesResponse>(
      (request, done) => this.client.getComplianceCaseRates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      complianceComplianceCaseCalculationServiceApi.GetComplianceCaseRatesRequest.fromPartial({ complianceCaseId: record.status })));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryTranscodeJobStatusLogOnly implements CarryTranscodeJobStatusWriter {
  async send(record: CarryTranscodeJobStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCarryTranscodeJobStatus(kind: string, record: CarryTranscodeJobStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: CarryTranscodeJobStatusRecord): Promise<void> => new CarryTranscodeJobStatusLogOnly().send(item);
  switch (kind) {
    case "moderation-lifecycle":
      write = (item) => new CarryTranscodeJobStatusModerationLifecycle(runtime).send(item);
      break;
    case "product-calculation":
      write = (item) => new CarryTranscodeJobStatusProductCalculation(runtime).send(item);
      break;
    case "compliance-case-calculation":
      write = (item) => new CarryTranscodeJobStatusComplianceCaseCalculation(runtime).send(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.media.v1.TranscodeJobApprovalService/EscalateTranscodeJob and hands what it keeps to the sink of
 * its kind.
 */
export async function carryTranscodeJobStatus(runtime: Runtime): Promise<void> {
  const upstream = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse>(
    (request, done) => upstream.escalateTranscodeJob(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest.fromPartial({ transcodeJobId: "primary-carry-transcode-job-status" }));
  const row: CarryTranscodeJobStatusRecord = {
    status: text.normalize(current.result?.status ?? ""),
    message: text.normalize(current.result?.message ?? ""),
  };
  await dispatchCarryTranscodeJobStatus("compliance-case-calculation", row, runtime);
}
