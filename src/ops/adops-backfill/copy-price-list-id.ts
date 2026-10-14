import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as ledgerLedgerAccountQueryServiceApi from "../../../.cache/proto/acme/ledger/v1/ledger_account_query_service.js";
import * as pricingPriceListServiceApi from "../../../.cache/proto/acme/pricing/v1/price_list_service.js";
import * as workplacesBuildingServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyPriceListId keeps of each DeletePriceList response. */
interface CopyPriceListIdRecord {
  correlationId: string;
  status: string;
  message: string;
}

/** Where copyPriceListId hands each record. */
interface CopyPriceListIdSink {
  apply(record: CopyPriceListIdRecord): Promise<void>;
}

/** Hands records to acme.workplaces.v1.BuildingService. */
class CopyPriceListIdBuilding implements CopyPriceListIdSink {
  private readonly client: workplacesBuildingServiceApi.BuildingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new workplacesBuildingServiceApi.BuildingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyPriceListIdRecord): Promise<void> {
    await call<workplacesBuildingServiceApi.DeleteBuildingRequest, workplacesBuildingServiceApi.DeleteBuildingResponse>(
      (request, done) => this.client.deleteBuilding(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      workplacesBuildingServiceApi.DeleteBuildingRequest.fromPartial({ etag: record.message, buildingId: record.status }));
  }
}

/** Sends records to acme.ledger.v1.LedgerAccountQueryService. */
class CopyPriceListIdLedgerAccountQuery implements CopyPriceListIdSink {
  private readonly client: ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ledgerLedgerAccountQueryServiceApi.LedgerAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyPriceListIdRecord): Promise<void> {
    await call<ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountRequest, ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountResponse>(
      (request, done) => this.client.lookupLedgerAccount(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      ledgerLedgerAccountQueryServiceApi.LookupLedgerAccountRequest.fromPartial({ ledgerAccountId: record.message }));
  }
}

/** Hands records to acme.keymanagement.v1.CryptoKeyCalculationService. */
class CopyPriceListIdCryptoKeyCalculation implements CopyPriceListIdSink {
  private readonly client: keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: CopyPriceListIdRecord): Promise<void> {
    await call<keymanagementCryptoKeyCalculationServiceApi.QuoteCryptoKeyRequest, keymanagementCryptoKeyCalculationServiceApi.QuoteCryptoKeyResponse>(
      (request, done) => this.client.quoteCryptoKey(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      keymanagementCryptoKeyCalculationServiceApi.QuoteCryptoKeyRequest.fromPartial({ details: { currencyCode: record.correlationId }, cryptoKey: { currencyCode: record.status, cryptoKeyId: record.message } }));
  }
}

/** Reads acme.pricing.v1.PriceListService/DeletePriceList and hands what it keeps to the sink of its kind. */
export async function copyPriceListId(runtime: Runtime): Promise<void> {
  const upstream = new pricingPriceListServiceApi.PriceListServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<pricingPriceListServiceApi.DeletePriceListRequest, pricingPriceListServiceApi.DeletePriceListResponse>(
    (request, done) => upstream.deletePriceList(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    pricingPriceListServiceApi.DeletePriceListRequest.fromPartial({ reason: "default-copy-price-list-id" }));
  const entry: CopyPriceListIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    status: text.normalize(reply.result?.status ?? ""),
    message: reply.result?.message ?? "",
  };
  const registry: Record<string, CopyPriceListIdSink> = {};
  for (const entry of [
    { kind: "building", sink: new CopyPriceListIdBuilding(runtime) },
    { kind: "ledger-account-query", sink: new CopyPriceListIdLedgerAccountQuery(runtime) },
    { kind: "crypto-key-calculation", sink: new CopyPriceListIdCryptoKeyCalculation(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["ledger-account-query"]!.apply(entry);
}
