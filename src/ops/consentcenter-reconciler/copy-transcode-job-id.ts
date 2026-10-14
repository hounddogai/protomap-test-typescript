import * as audiencesAudienceSyncLifecycleServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_sync_lifecycle_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as sellersSellerCalculationServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_calculation_service.js";
import * as yardsYardCalculationServiceApi from "../../../.cache/proto/acme/yards/v1/yard_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyTranscodeJobId keeps of each RecallTranscodeJob response. */
interface CopyTranscodeJobIdRecord {
  correlationId: string;
  status: string;
  resultStatus: string;
}

/** Where copyTranscodeJobId hands each record. */
interface CopyTranscodeJobIdWriter {
  apply(record: CopyTranscodeJobIdRecord): Promise<void>;
}

/** Writes records to acme.yards.v1.YardCalculationService. */
class CopyTranscodeJobIdYardCalculation implements CopyTranscodeJobIdWriter {
  private readonly client: yardsYardCalculationServiceApi.YardCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new yardsYardCalculationServiceApi.YardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobIdRecord): Promise<void> {
    await retry(() => call<yardsYardCalculationServiceApi.CalculateYardRequest, yardsYardCalculationServiceApi.CalculateYardResponse>(
      (request, done) => this.client.calculateYard(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      yardsYardCalculationServiceApi.CalculateYardRequest.fromPartial({ yard: { code: record.status } })));
  }
}

/** Passes records to acme.sellers.v1.SellerCalculationService. */
class CopyTranscodeJobIdSellerCalculation implements CopyTranscodeJobIdWriter {
  private readonly client: sellersSellerCalculationServiceApi.SellerCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sellersSellerCalculationServiceApi.SellerCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobIdRecord): Promise<void> {
    await retry(() => call<sellersSellerCalculationServiceApi.EstimateSellerRequest, sellersSellerCalculationServiceApi.EstimateSellerResponse>(
      (request, done) => this.client.estimateSeller(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      sellersSellerCalculationServiceApi.EstimateSellerRequest.fromPartial({ reason: record.status })));
  }
}

/** Hands records to acme.audiences.v1.AudienceSyncLifecycleService. */
class CopyTranscodeJobIdAudienceSyncLifecycle implements CopyTranscodeJobIdWriter {
  private readonly client: audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceSyncLifecycleServiceApi.AudienceSyncLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyTranscodeJobIdRecord): Promise<void> {
    await call<audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncRequest, audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncResponse>(
      (request, done) => this.client.reinstateAudienceSync(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      audiencesAudienceSyncLifecycleServiceApi.ReinstateAudienceSyncRequest.fromPartial({ details: { reasonCode: record.correlationId }, audienceSyncId: record.resultStatus, reason: record.status }));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyTranscodeJobId(kind: string, record: CopyTranscodeJobIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "yard-calculation": () => new CopyTranscodeJobIdYardCalculation(runtime).apply(record),
    "seller-calculation": () => new CopyTranscodeJobIdSellerCalculation(runtime).apply(record),
    "audience-sync-lifecycle": () => new CopyTranscodeJobIdAudienceSyncLifecycle(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.media.v1.TranscodeJobApprovalService/RecallTranscodeJob and hands what it keeps to the sink of
 * its kind.
 */
export async function copyTranscodeJobId(runtime: Runtime): Promise<void> {
  const origin = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobResponse>(
    (request, done) => origin.recallTranscodeJob(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    mediaTranscodeJobApprovalServiceApi.RecallTranscodeJobRequest.fromPartial({ reason: "current-copy-transcode-job-id" }));
  const record: CopyTranscodeJobIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    status: reply.outcome?.status ?? "",
    resultStatus: reply.result?.status ?? "",
  };
  await actOnCopyTranscodeJobId("audience-sync-lifecycle", record, runtime);
}
