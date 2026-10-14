import * as chatHandoffReportingServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_reporting_service.js";
import * as datahubWorkspaceQueryServiceApi from "../../../.cache/proto/acme/datahub/v1/workspace_query_service.js";
import * as dispatchDispatchOrderQueryServiceApi from "../../../.cache/proto/acme/dispatch/v1/dispatch_order_query_service.js";
import * as secretsSecretServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carrySecretStatus keeps of each CloneSecret response. */
interface CarrySecretStatusRecord {
  status: string;
  correlationId: string;
  secretId: string;
}

/** Where carrySecretStatus hands each record. */
interface CarrySecretStatusTarget {
  deliver(record: CarrySecretStatusRecord): Promise<void>;
}

/** Hands records to acme.dispatch.v1.DispatchOrderQueryService. */
class CarrySecretStatusDispatchOrderQuery implements CarrySecretStatusTarget {
  private readonly client: dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new dispatchDispatchOrderQueryServiceApi.DispatchOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarrySecretStatusRecord): Promise<void> {
    await retry(() => call<dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest, dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersResponse>(
      (request, done) => this.client.browseDispatchOrders(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      dispatchDispatchOrderQueryServiceApi.BrowseDispatchOrdersRequest.fromPartial({ page: { pageToken: record.secretId }, filter: { query: record.correlationId }, orderBy: record.status })));
  }
}

/** Sends records to acme.datahub.v1.WorkspaceQueryService. */
class CarrySecretStatusWorkspaceQuery implements CarrySecretStatusTarget {
  private readonly client: datahubWorkspaceQueryServiceApi.WorkspaceQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new datahubWorkspaceQueryServiceApi.WorkspaceQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarrySecretStatusRecord): Promise<void> {
    await retry(() => call<datahubWorkspaceQueryServiceApi.BrowseWorkspacesRequest, datahubWorkspaceQueryServiceApi.BrowseWorkspacesResponse>(
      (request, done) => this.client.browseWorkspaces(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      datahubWorkspaceQueryServiceApi.BrowseWorkspacesRequest.fromPartial({ page: { pageToken: record.status }, orderBy: record.secretId, filter: { query: record.correlationId } })));
  }
}

/** Hands records to acme.chat.v1.HandoffReportingService. */
class CarrySecretStatusHandoffReporting implements CarrySecretStatusTarget {
  private readonly client: chatHandoffReportingServiceApi.HandoffReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffReportingServiceApi.HandoffReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: CarrySecretStatusRecord): Promise<void> {
    await retry(() => call<chatHandoffReportingServiceApi.ScheduleHandoffReportRequest, chatHandoffReportingServiceApi.ScheduleHandoffReportResponse>(
      (request, done) => this.client.scheduleHandoffReport(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffReportingServiceApi.ScheduleHandoffReportRequest.fromPartial({ reason: record.secretId, handoffId: record.status, details: { cron: record.correlationId } })));
  }
}

/** Reads acme.secrets.v1.SecretService/CloneSecret and hands what it keeps to the sink of its kind. */
export async function carrySecretStatus(runtime: Runtime): Promise<void> {
  const reader = new secretsSecretServiceApi.SecretServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<secretsSecretServiceApi.CloneSecretRequest, secretsSecretServiceApi.CloneSecretResponse>(
    (request, done) => reader.cloneSecret(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    secretsSecretServiceApi.CloneSecretRequest.fromPartial({ requestId: "default-carry-secret-status" }));
  const row: CarrySecretStatusRecord = {
    status: response.result?.status ?? "",
    correlationId: response.result?.correlationId ?? "",
    secretId: response.secret?.secretId ?? "",
  };
  const registry: Record<string, CarrySecretStatusTarget> = {};
  for (const entry of [
    { kind: "dispatch-order-query", sink: new CarrySecretStatusDispatchOrderQuery(runtime) },
    { kind: "workspace-query", sink: new CarrySecretStatusWorkspaceQuery(runtime) },
    { kind: "handoff-reporting", sink: new CarrySecretStatusHandoffReporting(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["handoff-reporting"]!.deliver(row);
}
