import * as datasetsDatasetServiceApi from "../../../.cache/proto/acme/datasets/v1/dataset_service.js";
import * as messagingParticipantValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayGetDatasetsStatus keeps of each BatchGetDatasets response. */
interface ReplayGetDatasetsStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
  message: string;
}

/**
 * Reads acme.datasets.v1.DatasetService/BatchGetDatasets, keeps its fields by name, and passes some of them
 * to acme.messaging.v1.ParticipantValidationService.
 */
export async function replayGetDatasetsStatus(runtime: Runtime): Promise<void> {
  const source = new datasetsDatasetServiceApi.DatasetServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<datasetsDatasetServiceApi.BatchGetDatasetsRequest, datasetsDatasetServiceApi.BatchGetDatasetsResponse>(
    (request, done) => source.batchGetDatasets(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    datasetsDatasetServiceApi.BatchGetDatasetsRequest.fromPartial({}));
  const record: ReplayGetDatasetsStatusRecord = {
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
    nextPageToken: response.pageInfo?.nextPageToken ?? "",
    message: response.result?.message ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("status", record.status);
  carried.set("correlation-id", record.correlationId);
  carried.set("next-page-token", record.nextPageToken);
  carried.set("message", record.message);
  const downstream = new messagingParticipantValidationServiceApi.ParticipantValidationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<messagingParticipantValidationServiceApi.GetParticipantRulesRequest, messagingParticipantValidationServiceApi.GetParticipantRulesResponse>(
    (request, done) => downstream.getParticipantRules(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingParticipantValidationServiceApi.GetParticipantRulesRequest.fromPartial({ participantId: carried.get("correlation-id") ?? "" }));
}
