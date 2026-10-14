import * as keymanagementCryptoKeyQueryServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as personalizationProfileCalculationServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryCryptoKeysStatus keeps of each FindCryptoKeys response. */
interface CarryCryptoKeysStatusRecord {
  status: string;
  message: string;
  nextPageToken: string;
  correlationId: string;
}

/**
 * Reads acme.keymanagement.v1.CryptoKeyQueryService/FindCryptoKeys, keeps its fields by name, and passes some
 * of them to acme.personalization.v1.ProfileCalculationService.
 */
export async function carryCryptoKeysStatus(runtime: Runtime): Promise<void> {
  const source = new keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysRequest, keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysResponse>(
    (request, done) => source.findCryptoKeys(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    keymanagementCryptoKeyQueryServiceApi.FindCryptoKeysRequest.fromPartial({ orderBy: "primary-carry-crypto-keys-status" }));
  const record: CarryCryptoKeysStatusRecord = {
    status: reply.result?.status ?? "",
    message: reply.result?.message ?? "",
    nextPageToken: reply.pageInfo?.nextPageToken ?? "",
    correlationId: reply.result?.correlationId ?? "",
  };
  const params = new Headers();
  params.set("x-status", record.status);
  params.set("x-message", record.message);
  params.set("x-next-page-token", record.nextPageToken);
  params.set("x-correlation-id", record.correlationId);
  const target = new personalizationProfileCalculationServiceApi.ProfileCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<personalizationProfileCalculationServiceApi.CalculateProfileRequest, personalizationProfileCalculationServiceApi.CalculateProfileResponse>(
    (request, done) => target.calculateProfile(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    personalizationProfileCalculationServiceApi.CalculateProfileRequest.fromPartial({ profileId: params.get("x-message") ?? "" })));
}
