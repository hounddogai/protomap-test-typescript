import * as contractsContractQueryServiceApi from "../../../.cache/proto/acme/contracts/v1/contract_query_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import * as localizationTranslationKeyCalculationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorPendingTranslationKeysId keeps of each ListPendingTranslationKeys response. */
interface MirrorPendingTranslationKeysIdRecord {
  correlationId: string;
  nextPageToken: string;
  message: string;
  status: string;
}

/** Where mirrorPendingTranslationKeysId hands each record. */
interface MirrorPendingTranslationKeysIdTarget {
  apply(record: MirrorPendingTranslationKeysIdRecord): Promise<void>;
}

/** Sends records to acme.localization.v1.TranslationKeyCalculationService. */
class MirrorPendingTranslationKeysIdTranslationKeyCalculation implements MirrorPendingTranslationKeysIdTarget {
  private readonly client: localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyCalculationServiceApi.TranslationKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorPendingTranslationKeysIdRecord): Promise<void> {
    await call<localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest, localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyResponse>(
      (request, done) => this.client.estimateTranslationKey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      localizationTranslationKeyCalculationServiceApi.EstimateTranslationKeyRequest.fromPartial({ details: { currencyCode: record.message } }));
  }
}

/** Hands records to acme.contracts.v1.ContractQueryService. */
class MirrorPendingTranslationKeysIdContractQuery implements MirrorPendingTranslationKeysIdTarget {
  private readonly client: contractsContractQueryServiceApi.ContractQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contractsContractQueryServiceApi.ContractQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: MirrorPendingTranslationKeysIdRecord): Promise<void> {
    await call<contractsContractQueryServiceApi.LookupContractRequest, contractsContractQueryServiceApi.LookupContractResponse>(
      (request, done) => this.client.lookupContract(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contractsContractQueryServiceApi.LookupContractRequest.fromPartial({ contractId: record.status }));
  }
}

/**
 * Reads acme.localization.v1.TranslationKeyApprovalService/ListPendingTranslationKeys and hands what it keeps
 * to the sink of its kind.
 */
export async function mirrorPendingTranslationKeysId(runtime: Runtime): Promise<void> {
  const source = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest, localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysResponse>(
    (request, done) => source.listPendingTranslationKeys(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    localizationTranslationKeyApprovalServiceApi.ListPendingTranslationKeysRequest.fromPartial({ orderBy: "current-mirror-pending-translation-keys-id" })));
  const record: MirrorPendingTranslationKeysIdRecord = {
    correlationId: current.result?.correlationId ?? "",
    nextPageToken: current.pageInfo?.nextPageToken ?? "",
    message: current.result?.message ?? "",
    status: current.result?.status ?? "",
  };
  const registry: Record<string, MirrorPendingTranslationKeysIdTarget> = {};
  for (const entry of [
    { kind: "translation-key-calculation", sink: new MirrorPendingTranslationKeysIdTranslationKeyCalculation(runtime) },
    { kind: "contract-query", sink: new MirrorPendingTranslationKeysIdContractQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["translation-key-calculation"]!.apply(record);
}
