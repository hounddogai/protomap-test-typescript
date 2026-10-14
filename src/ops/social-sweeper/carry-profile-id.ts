import * as chatChatRoomWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as edgegatewayRouteBindingQueryServiceApi from "../../../.cache/proto/acme/edgegateway/v1/route_binding_query_service.js";
import * as personalizationProfileApprovalServiceApi from "../../../.cache/proto/acme/personalization/v1/profile_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryProfileId keeps of each ApproveProfile response. */
interface CarryProfileIdRecord {
  correlationId: string;
  referenceId: string;
  status: string;
}

/** Where carryProfileId hands each record. */
interface CarryProfileIdWriter {
  push(record: CarryProfileIdRecord): Promise<void>;
}

/** Hands records to acme.edgegateway.v1.RouteBindingQueryService. */
class CarryProfileIdRouteBindingQuery implements CarryProfileIdWriter {
  private readonly client: edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new edgegatewayRouteBindingQueryServiceApi.RouteBindingQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryProfileIdRecord): Promise<void> {
    await call<edgegatewayRouteBindingQueryServiceApi.PeekRouteBindingRequest, edgegatewayRouteBindingQueryServiceApi.PeekRouteBindingResponse>(
      (request, done) => this.client.peekRouteBinding(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      edgegatewayRouteBindingQueryServiceApi.PeekRouteBindingRequest.fromPartial({ routeBindingId: record.referenceId }));
  }
}

/** Sends records to acme.chat.v1.ChatRoomWorkflowService. */
class CarryProfileIdChatRoomWorkflow implements CarryProfileIdWriter {
  private readonly client: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: CarryProfileIdRecord): Promise<void> {
    await call<chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowResponse>(
      (request, done) => this.client.startChatRoomWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatChatRoomWorkflowServiceApi.StartChatRoomWorkflowRequest.fromPartial({ chatRoom: { code: record.referenceId }, details: { step: record.status } }));
  }
}

/**
 * Reads acme.personalization.v1.ProfileApprovalService/ApproveProfile and hands what it keeps to the sink of
 * its kind.
 */
export async function carryProfileId(runtime: Runtime): Promise<void> {
  const origin = new personalizationProfileApprovalServiceApi.ProfileApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<personalizationProfileApprovalServiceApi.ApproveProfileRequest, personalizationProfileApprovalServiceApi.ApproveProfileResponse>(
    (request, done) => origin.approveProfile(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    personalizationProfileApprovalServiceApi.ApproveProfileRequest.fromPartial({ reason: "nightly-carry-profile-id" })));
  const record: CarryProfileIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    referenceId: response.outcome?.referenceId ?? "",
    status: response.outcome?.status ?? "",
  };
  const sinks: CarryProfileIdWriter[] = [
    new CarryProfileIdRouteBindingQuery(runtime),
    new CarryProfileIdChatRoomWorkflow(runtime),
  ];
  await sinks[1]!.push(record);
}
