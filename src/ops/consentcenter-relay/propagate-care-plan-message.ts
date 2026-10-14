import * as careplansCarePlanCalculationServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as communityPostValidationServiceApi from "../../../.cache/proto/acme/community/v1/post_validation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as mediaMediaAssetServiceApi from "../../../.cache/proto/acme/media/v1/media_asset_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateCarePlanMessage keeps of each CalculateCarePlan response. */
interface PropagateCarePlanMessageRecord {
  message: string;
  number: string;
  carePlanId: string;
}

/** Where propagateCarePlanMessage hands each record. */
interface PropagateCarePlanMessageSink {
  deliver(record: PropagateCarePlanMessageRecord): Promise<void>;
}

/** Writes records to acme.media.v1.MediaAssetService. */
class PropagateCarePlanMessageMediaAsset implements PropagateCarePlanMessageSink {
  private readonly client: mediaMediaAssetServiceApi.MediaAssetServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaMediaAssetServiceApi.MediaAssetServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateCarePlanMessageRecord): Promise<void> {
    await retry(() => call<mediaMediaAssetServiceApi.SearchMediaAssetsRequest, mediaMediaAssetServiceApi.SearchMediaAssetsResponse>(
      (request, done) => this.client.searchMediaAssets(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetServiceApi.SearchMediaAssetsRequest.fromPartial({ orderBy: record.number, page: { pageToken: record.carePlanId }, filter: { region: record.message } })));
  }
}

/** Sends records to acme.community.v1.PostValidationService. */
class PropagateCarePlanMessagePostValidation implements PropagateCarePlanMessageSink {
  private readonly client: communityPostValidationServiceApi.PostValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostValidationServiceApi.PostValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateCarePlanMessageRecord): Promise<void> {
    await retry(() => call<communityPostValidationServiceApi.PreviewPostRequest, communityPostValidationServiceApi.PreviewPostResponse>(
      (request, done) => this.client.previewPost(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityPostValidationServiceApi.PreviewPostRequest.fromPartial({ post: { postId: record.message }, reason: record.carePlanId })));
  }
}

/** Hands records to acme.ledger.v1.LedgerAccountQueryService. */
class PropagateCarePlanMessageLedgerAccountQuery implements PropagateCarePlanMessageSink {
  private readonly client: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PropagateCarePlanMessageRecord): Promise<void> {
    await retry(() => call<ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest, ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsResponse>(
      (request, done) => this.client.summarizeLedgerAccounts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      ledgerLedgerAccountQueryServiceApi.SummarizeLedgerAccountsRequest.fromPartial({ details: { format: record.number }, reason: record.carePlanId })));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateCarePlanMessageLogOnly implements PropagateCarePlanMessageSink {
  async deliver(record: PropagateCarePlanMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPropagateCarePlanMessage(kind: string, record: PropagateCarePlanMessageRecord, runtime: Runtime): Promise<void> {
  let sink: PropagateCarePlanMessageSink = new PropagateCarePlanMessageLogOnly();
  switch (kind) {
    case "media-asset":
      sink = new PropagateCarePlanMessageMediaAsset(runtime);
      break;
    case "post-validation":
      sink = new PropagateCarePlanMessagePostValidation(runtime);
      break;
    case "ledger-account-query":
      sink = new PropagateCarePlanMessageLedgerAccountQuery(runtime);
      break;
  }
  await sink.deliver(record);
}

/**
 * Reads acme.careplans.v1.CarePlanCalculationService/CalculateCarePlan and hands what it keeps to the sink of
 * its kind.
 */
export async function propagateCarePlanMessage(runtime: Runtime): Promise<void> {
  const upstream = new careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<careplansCarePlanCalculationServiceApi.CalculateCarePlanRequest, careplansCarePlanCalculationServiceApi.CalculateCarePlanResponse>(
    (request, done) => upstream.calculateCarePlan(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    careplansCarePlanCalculationServiceApi.CalculateCarePlanRequest.fromPartial({ carePlanId: "nightly-propagate-care-plan-message" }));
  const kept: PropagateCarePlanMessageRecord = {
    message: text.normalize(response.result?.message ?? ""),
    number: response.carePlan?.number ?? "",
    carePlanId: response.carePlan?.carePlanId ?? "",
  };
  await deliverPropagateCarePlanMessage("media-asset", kept, runtime);
}
