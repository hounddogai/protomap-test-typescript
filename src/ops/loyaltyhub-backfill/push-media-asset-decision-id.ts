import * as contentContentBlockQueryServiceApi from "../../../.cache/proto/acme/content/v1/content_block_query_service.js";
import * as contentContentBlockValidationServiceApi from "../../../.cache/proto/acme/content/v1/content_block_validation_service.js";
import * as formsFormCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as mediaMediaAssetValidationServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushMediaAssetDecisionId keeps of each ExplainMediaAssetDecision response. */
interface PushMediaAssetDecisionIdRecord {
  referenceId: string;
  correlationId: string;
}

/** Where pushMediaAssetDecisionId hands each record. */
interface PushMediaAssetDecisionIdSink {
  forward(record: PushMediaAssetDecisionIdRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormCalculationService. */
class PushMediaAssetDecisionIdFormCalculation implements PushMediaAssetDecisionIdSink {
  private readonly client: formsFormCalculationServiceApi.FormCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormCalculationServiceApi.FormCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PushMediaAssetDecisionIdRecord): Promise<void> {
    await retry(() => call<formsFormCalculationServiceApi.CompareFormOptionsRequest, formsFormCalculationServiceApi.CompareFormOptionsResponse>(
      (request, done) => this.client.compareFormOptions(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      formsFormCalculationServiceApi.CompareFormOptionsRequest.fromPartial({ form: { number: record.referenceId } })));
  }
}

/** Hands records to acme.content.v1.ContentBlockValidationService. */
class PushMediaAssetDecisionIdContentBlockValidation implements PushMediaAssetDecisionIdSink {
  private readonly client: contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockValidationServiceApi.ContentBlockValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PushMediaAssetDecisionIdRecord): Promise<void> {
    await call<contentContentBlockValidationServiceApi.GetContentBlockRulesRequest, contentContentBlockValidationServiceApi.GetContentBlockRulesResponse>(
      (request, done) => this.client.getContentBlockRules(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contentContentBlockValidationServiceApi.GetContentBlockRulesRequest.fromPartial({ contentBlockId: record.referenceId }));
  }
}

/** Writes records to acme.content.v1.ContentBlockQueryService. */
class PushMediaAssetDecisionIdContentBlockQuery implements PushMediaAssetDecisionIdSink {
  private readonly client: contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentContentBlockQueryServiceApi.ContentBlockQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: PushMediaAssetDecisionIdRecord): Promise<void> {
    await call<contentContentBlockQueryServiceApi.CountContentBlocksRequest, contentContentBlockQueryServiceApi.CountContentBlocksResponse>(
      (request, done) => this.client.countContentBlocks(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentContentBlockQueryServiceApi.CountContentBlocksRequest.fromPartial({ orderBy: record.referenceId, filter: { ownerId: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PushMediaAssetDecisionIdLogOnly implements PushMediaAssetDecisionIdSink {
  async forward(record: PushMediaAssetDecisionIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPushMediaAssetDecisionId(kind: string, record: PushMediaAssetDecisionIdRecord, runtime: Runtime): Promise<void> {
  let sink: PushMediaAssetDecisionIdSink = new PushMediaAssetDecisionIdLogOnly();
  switch (kind) {
    case "form-calculation":
      sink = new PushMediaAssetDecisionIdFormCalculation(runtime);
      break;
    case "content-block-validation":
      sink = new PushMediaAssetDecisionIdContentBlockValidation(runtime);
      break;
    case "content-block-query":
      sink = new PushMediaAssetDecisionIdContentBlockQuery(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.media.v1.MediaAssetValidationService/ExplainMediaAssetDecision and hands what it keeps to the
 * sink of its kind.
 */
export async function pushMediaAssetDecisionId(runtime: Runtime): Promise<void> {
  const origin = new mediaMediaAssetValidationServiceApi.MediaAssetValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest, mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionResponse>(
    (request, done) => origin.explainMediaAssetDecision(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    mediaMediaAssetValidationServiceApi.ExplainMediaAssetDecisionRequest.fromPartial({ reason: "primary-push-media-asset-decision-id" }));
  const kept: PushMediaAssetDecisionIdRecord = {
    referenceId: response.outcome?.referenceId ?? "",
    correlationId: response.result?.correlationId ?? "",
  };
  await deliverPushMediaAssetDecisionId("form-calculation", kept, runtime);
}
