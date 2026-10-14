import * as catalogProductQueryServiceApi from "../../../.cache/proto/acme/catalog/v1/product_query_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyRegisteredModelCode keeps of each QuoteRegisteredModel response. */
interface CopyRegisteredModelCodeRecord {
  code: string;
  registeredModelId: string;
}

/** Where copyRegisteredModelCode hands each record. */
interface CopyRegisteredModelCodeWriter {
  apply(record: CopyRegisteredModelCodeRecord): Promise<void>;
}

/** Writes records to acme.catalog.v1.ProductQueryService. */
class CopyRegisteredModelCodeProductQuery implements CopyRegisteredModelCodeWriter {
  private readonly client: catalogProductQueryServiceApi.ProductQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new catalogProductQueryServiceApi.ProductQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyRegisteredModelCodeRecord): Promise<void> {
    await retry(() => call<catalogProductQueryServiceApi.LookupProductRequest, catalogProductQueryServiceApi.LookupProductResponse>(
      (request, done) => this.client.lookupProduct(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      catalogProductQueryServiceApi.LookupProductRequest.fromPartial({ productId: record.code })));
  }
}

/** Passes records to acme.media.v1.TranscodeJobApprovalService. */
class CopyRegisteredModelCodeTranscodeJobApproval implements CopyRegisteredModelCodeWriter {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyRegisteredModelCodeRecord): Promise<void> {
    await call<mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobResponse>(
      (request, done) => this.client.rejectTranscodeJob(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaTranscodeJobApprovalServiceApi.RejectTranscodeJobRequest.fromPartial({ transcodeJobId: record.registeredModelId }));
  }
}

/** Runs the action registered for kind. */
async function actOnCopyRegisteredModelCode(kind: string, record: CopyRegisteredModelCodeRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "product-query": () => new CopyRegisteredModelCodeProductQuery(runtime).apply(record),
    "transcode-job-approval": () => new CopyRegisteredModelCodeTranscodeJobApproval(runtime).apply(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.modelregistry.v1.RegisteredModelCalculationService/QuoteRegisteredModel and hands what it keeps
 * to the sink of its kind.
 */
export async function copyRegisteredModelCode(runtime: Runtime): Promise<void> {
  const origin = new modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<modelregistryRegisteredModelCalculationServiceApi.QuoteRegisteredModelRequest, modelregistryRegisteredModelCalculationServiceApi.QuoteRegisteredModelResponse>(
    (request, done) => origin.quoteRegisteredModel(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    modelregistryRegisteredModelCalculationServiceApi.QuoteRegisteredModelRequest.fromPartial({ registeredModelId: "main-copy-registered-model-code" })));
  const row: CopyRegisteredModelCodeRecord = {
    code: text.normalize(reply.registeredModel?.code ?? ""),
    registeredModelId: reply.registeredModel?.registeredModelId ?? "",
  };
  await actOnCopyRegisteredModelCode("transcode-job-approval", row, runtime);
}
