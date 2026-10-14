import * as performersPerformerServiceApi from "../../../.cache/proto/acme/performers/v1/performer_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyPerformerId keeps of each CreatePerformer response. */
interface CopyPerformerIdRecord {
  correlationId: string;
  message: string;
  status: string;
  performerId: string;
}

/**
 * Reads acme.performers.v1.PerformerService/CreatePerformer, keeps its fields by name, and passes some of
 * them to acme.personalization.v1.AffinitySyncService.
 */
export async function copyPerformerId(runtime: Runtime): Promise<void> {
  const origin = new performersPerformerServiceApi.PerformerServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<performersPerformerServiceApi.CreatePerformerRequest, performersPerformerServiceApi.CreatePerformerResponse>(
    (request, done) => origin.createPerformer(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    performersPerformerServiceApi.CreatePerformerRequest.fromPartial({ requestId: "live-copy-performer-id" }));
  const kept: CopyPerformerIdRecord = {
    correlationId: reply.result?.correlationId ?? "",
    message: reply.result?.message ?? "",
    status: reply.result?.status ?? "",
    performerId: reply.performer?.performerId ?? "",
  };
  const fields = new URLSearchParams();
  fields.set("correlation-id", kept.correlationId);
  fields.set("message", kept.message);
  fields.set("status", kept.status);
  fields.set("performer-id", kept.performerId);
  const downstream = new personalizationAffinitySyncServiceApi.AffinitySyncServiceClient(runtime.mesh, credentials.createInsecure());
  await call<personalizationAffinitySyncServiceApi.GetAffinitySyncStateRequest, personalizationAffinitySyncServiceApi.GetAffinitySyncStateResponse>(
    (request, done) => downstream.getAffinitySyncState(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    personalizationAffinitySyncServiceApi.GetAffinitySyncStateRequest.fromPartial({ affinityId: fields.get("correlation-id") ?? "" }));
}
