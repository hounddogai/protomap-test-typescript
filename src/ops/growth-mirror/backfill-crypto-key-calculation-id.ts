import * as keymanagementCryptoKeyCalculationServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_calculation_service.js";
import * as licensingSoftwareLicenseServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillCryptoKeyCalculationId keeps of each ExplainCryptoKeyCalculation response. */
interface BackfillCryptoKeyCalculationIdRecord {
  referenceId: string;
  message: string;
  correlationId: string;
  status: string;
}

/** Where backfillCryptoKeyCalculationId hands each record. */
interface BackfillCryptoKeyCalculationIdSink {
  deliver(record: BackfillCryptoKeyCalculationIdRecord): Promise<void>;
}

/** Writes records to acme.licensing.v1.SoftwareLicenseService. */
class BackfillCryptoKeyCalculationIdSoftwareLicense implements BackfillCryptoKeyCalculationIdSink {
  private readonly client: licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillCryptoKeyCalculationIdRecord): Promise<void> {
    await call<licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest, licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesResponse>(
      (request, done) => this.client.searchSoftwareLicenses(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      licensingSoftwareLicenseServiceApi.SearchSoftwareLicensesRequest.fromPartial({ filter: { ownerId: record.correlationId, query: record.status } }));
  }
}

/** Hands records to acme.suppliers.v1.SupplierQueryService. */
class BackfillCryptoKeyCalculationIdSupplierQuery implements BackfillCryptoKeyCalculationIdSink {
  private readonly client: suppliersSupplierQueryServiceApi.SupplierQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new suppliersSupplierQueryServiceApi.SupplierQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: BackfillCryptoKeyCalculationIdRecord): Promise<void> {
    await call<suppliersSupplierQueryServiceApi.BrowseSuppliersRequest, suppliersSupplierQueryServiceApi.BrowseSuppliersResponse>(
      (request, done) => this.client.browseSuppliers(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      suppliersSupplierQueryServiceApi.BrowseSuppliersRequest.fromPartial({ filter: { query: record.status, ownerId: record.correlationId }, orderBy: record.referenceId }));
  }
}

/**
 * Reads acme.keymanagement.v1.CryptoKeyCalculationService/ExplainCryptoKeyCalculation and hands what it keeps
 * to the sink of its kind.
 */
export async function backfillCryptoKeyCalculationId(runtime: Runtime): Promise<void> {
  const source = new keymanagementCryptoKeyCalculationServiceApi.CryptoKeyCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationRequest, keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationResponse>(
    (request, done) => source.explainCryptoKeyCalculation(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    keymanagementCryptoKeyCalculationServiceApi.ExplainCryptoKeyCalculationRequest.fromPartial({ cryptoKeyId: "primary-backfill-crypto-key-calculation-id" }));
  const kept: BackfillCryptoKeyCalculationIdRecord = {
    referenceId: text.normalize(current.outcome?.referenceId ?? ""),
    message: current.outcome?.message ?? "",
    correlationId: current.result?.correlationId ?? "",
    status: current.result?.status ?? "",
  };
  const registry: Record<string, BackfillCryptoKeyCalculationIdSink> = {};
  for (const entry of [
    { kind: "software-license", sink: new BackfillCryptoKeyCalculationIdSoftwareLicense(runtime) },
    { kind: "supplier-query", sink: new BackfillCryptoKeyCalculationIdSupplierQuery(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["supplier-query"]!.deliver(kept);
}
