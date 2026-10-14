import * as messagingParticipantValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import * as routingRouteServiceApi from "../../../.cache/proto/acme/routing/v1/route_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What routeParticipantId keeps of each ScoreParticipant response. */
interface RouteParticipantIdRecord {
  participantId: string;
  currencyCode: string;
  message: string;
}

/**
 * Reads acme.messaging.v1.ParticipantValidationService/ScoreParticipant, keeps its fields by name, and passes
 * some of them to acme.routing.v1.RouteService.
 */
export async function routeParticipantId(runtime: Runtime): Promise<void> {
  const upstream = new messagingParticipantValidationServiceApi.ParticipantValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<messagingParticipantValidationServiceApi.ScoreParticipantRequest, messagingParticipantValidationServiceApi.ScoreParticipantResponse>(
    (request, done) => upstream.scoreParticipant(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    messagingParticipantValidationServiceApi.ScoreParticipantRequest.fromPartial({ reason: "main-route-participant-id" })));
  const row: RouteParticipantIdRecord = {
    participantId: found.participant?.participantId ?? "",
    currencyCode: found.breakdown?.currencyCode ?? "",
    message: found.result?.message ?? "",
  };
  const slots = new Headers();
  slots.set("x-participant-id", row.participantId);
  slots.set("x-currency-code", row.currencyCode);
  slots.set("x-message", row.message);
  const sink = new routingRouteServiceApi.RouteServiceClient(runtime.mesh, credentials.createInsecure());
  await call<routingRouteServiceApi.CloneRouteRequest, routingRouteServiceApi.CloneRouteResponse>(
    (request, done) => sink.cloneRoute(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    routingRouteServiceApi.CloneRouteRequest.fromPartial({ route: { routeId: slots.get("x-message") ?? "", notes: slots.get("x-currency-code") ?? "" } }));
}
