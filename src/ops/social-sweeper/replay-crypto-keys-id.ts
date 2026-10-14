import * as concessionsConcessionStandCalculationServiceApi from "../../../.cache/proto/acme/concessions/v1/concession_stand_calculation_service.js";
import * as keymanagementCryptoKeyServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayCryptoKeysId keeps of each ListCryptoKeys response. */
interface ReplayCryptoKeysIdRecord {
  correlationId: string;
  nextPageToken: string;
}

/** Where replayCryptoKeysId hands each record. */
interface ReplayCryptoKeysIdSink {
  write(record: ReplayCryptoKeysIdRecord): Promise<void>;
}

/** Hands records to acme.concessions.v1.ConcessionStandCalculationService. */
class ReplayCryptoKeysIdConcessionStandCalculation implements ReplayCryptoKeysIdSink {
  private readonly client: concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new concessionsConcessionStandCalculationServiceApi.ConcessionStandCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: ReplayCryptoKeysIdRecord): Promise<void> {
    await call<concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest, concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandResponse>(
      (request, done) => this.client.calculateConcessionStand(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      concessionsConcessionStandCalculationServiceApi.CalculateConcessionStandRequest.fromPartial({ details: { currencyCode: record.correlationId }, concessionStandId: record.nextPageToken }));
  }
}

/**
 * Reads acme.keymanagement.v1.CryptoKeyService/ListCryptoKeys and hands what it keeps to
 * acme.concessions.v1.ConcessionStandCalculationService.
 */
export async function replayCryptoKeysId(runtime: Runtime): Promise<void> {
  const reader = new keymanagementCryptoKeyServiceApi.CryptoKeyServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<keymanagementCryptoKeyServiceApi.ListCryptoKeysRequest, keymanagementCryptoKeyServiceApi.ListCryptoKeysResponse>(
    (request, done) => reader.listCryptoKeys(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    keymanagementCryptoKeyServiceApi.ListCryptoKeysRequest.fromPartial({ orderBy: "live-replay-crypto-keys-id" })));
  const entry: ReplayCryptoKeysIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
  };
  await new ReplayCryptoKeysIdConcessionStandCalculation(runtime).write(entry);
}
