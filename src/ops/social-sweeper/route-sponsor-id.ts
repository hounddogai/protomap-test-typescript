import * as keymanagementCryptoKeyQueryServiceApi from "../../../.cache/proto/acme/keymanagement/v1/crypto_key_query_service.js";
import * as sponsorshipsSponsorQueryServiceApi from "../../../.cache/proto/acme/sponsorships/v1/sponsor_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeSponsorId keeps of each LookupSponsor response. */
interface RouteSponsorIdRecord {
  correlationId: string;
  status: string;
  sponsorId: string;
}

/**
 * Reads acme.sponsorships.v1.SponsorQueryService/LookupSponsor, keeps its fields by name, and passes some of
 * them to acme.keymanagement.v1.CryptoKeyQueryService.
 */
export async function routeSponsorId(runtime: Runtime): Promise<void> {
  const source = new sponsorshipsSponsorQueryServiceApi.SponsorQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<sponsorshipsSponsorQueryServiceApi.LookupSponsorRequest, sponsorshipsSponsorQueryServiceApi.LookupSponsorResponse>(
    (request, done) => source.lookupSponsor(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    sponsorshipsSponsorQueryServiceApi.LookupSponsorRequest.fromPartial({ sponsorId: "primary-route-sponsor-id" }));
  const record: RouteSponsorIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    status: response.result?.status ?? "",
    sponsorId: response.sponsor?.sponsorId ?? "",
  };
  const params = new Headers();
  params.set("x-correlation-id", record.correlationId);
  params.set("x-status", record.status);
  params.set("x-sponsor-id", record.sponsorId);
  const writer = new keymanagementCryptoKeyQueryServiceApi.CryptoKeyQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<keymanagementCryptoKeyQueryServiceApi.LookupCryptoKeyRequest, keymanagementCryptoKeyQueryServiceApi.LookupCryptoKeyResponse>(
    (request, done) => writer.lookupCryptoKey(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    keymanagementCryptoKeyQueryServiceApi.LookupCryptoKeyRequest.fromPartial({ cryptoKeyId: params.get("x-correlation-id") ?? "" }));
}
