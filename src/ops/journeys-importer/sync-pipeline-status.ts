import * as certificatesCertificateServiceApi from "../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as pipelinesPipelineCalculationServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_calculation_service.js";
import * as workplacesBuildingServiceApi from "../../../.cache/proto/acme/workplaces/v1/building_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What syncPipelineStatus keeps of each EstimatePipeline response. */
interface SyncPipelineStatusRecord {
  status: string;
  correlationId: string;
}

/** Where syncPipelineStatus hands each record. */
interface SyncPipelineStatusDestination {
  forward(record: SyncPipelineStatusRecord): Promise<void>;
}

/** Hands records to acme.certificates.v1.CertificateService. */
class SyncPipelineStatusCertificate implements SyncPipelineStatusDestination {
  private readonly client: certificatesCertificateServiceApi.CertificateServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new certificatesCertificateServiceApi.CertificateServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncPipelineStatusRecord): Promise<void> {
    await call<certificatesCertificateServiceApi.DeleteCertificateRequest, certificatesCertificateServiceApi.DeleteCertificateResponse>(
      (request, done) => this.client.deleteCertificate(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      certificatesCertificateServiceApi.DeleteCertificateRequest.fromPartial({ certificateId: record.status, reason: record.correlationId }));
  }
}

/** Hands records to acme.dispatch.v1.DispatchOrderQueryService. */
class SyncPipelineStatusDispatchOrderQuery implements SyncPipelineStatusDestination {
  private readonly client: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncPipelineStatusRecord): Promise<void> {
    await call<dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersResponse>(
      (request, done) => this.client.browseDispatchOrders(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest.fromPartial({ filter: { ownerId: record.correlationId, region: record.status } }));
  }
}

/** Writes records to acme.workplaces.v1.BuildingService. */
class SyncPipelineStatusBuilding implements SyncPipelineStatusDestination {
  private readonly client: workplacesBuildingServiceApi.BuildingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new workplacesBuildingServiceApi.BuildingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: SyncPipelineStatusRecord): Promise<void> {
    await call<workplacesBuildingServiceApi.ListBuildingsRequest, workplacesBuildingServiceApi.ListBuildingsResponse>(
      (request, done) => this.client.listBuildings(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      workplacesBuildingServiceApi.ListBuildingsRequest.fromPartial({ filter: { ownerId: record.status, region: record.correlationId } }));
  }
}

/**
 * Reads acme.pipelines.v1.PipelineCalculationService/EstimatePipeline and hands what it keeps to the sink of
 * its kind.
 */
export async function syncPipelineStatus(runtime: Runtime): Promise<void> {
  const source = new pipelinesPipelineCalculationServiceApi.PipelineCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<pipelinesPipelineCalculationServiceApi.EstimatePipelineRequest, pipelinesPipelineCalculationServiceApi.EstimatePipelineResponse>(
    (request, done) => source.estimatePipeline(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    pipelinesPipelineCalculationServiceApi.EstimatePipelineRequest.fromPartial({ pipelineId: "main-sync-pipeline-status" }));
  const record: SyncPipelineStatusRecord = {
    status: found.result?.status ?? "",
    correlationId: text.normalize(found.result?.correlationId ?? ""),
  };
  const registry: Record<string, SyncPipelineStatusDestination> = {};
  for (const entry of [
    { kind: "certificate", sink: new SyncPipelineStatusCertificate(runtime) },
    { kind: "dispatch-order-query", sink: new SyncPipelineStatusDispatchOrderQuery(runtime) },
    { kind: "building", sink: new SyncPipelineStatusBuilding(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["dispatch-order-query"]!.forward(record);
}
