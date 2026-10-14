/**
 * Connects external systems that send client session events.
 */

import * as webbffClientSessionIntegrationServiceApi from "../../../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { clientStream, duplex, unary } from "../../../../platform/handlers.js";
import { ClientSessionIntegrationWorkflow } from "./client-session-integration.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ClientSessionIntegrationService; workflows own validation and database transactions.
 */
@injectable()
export class ClientSessionIntegrationHandler {
  constructor(@inject(ClientSessionIntegrationWorkflow) private readonly workflow: ClientSessionIntegrationWorkflow) {}

  /**
   * Acknowledges a client session.
   */
  acknowledgeClientSessionEvent = unary<webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventRequest, webbffClientSessionIntegrationServiceApi.AcknowledgeClientSessionEventResponse>(
    (request) => this.workflow.acknowledgeClientSessionEvent(request),
  );

  /**
   * Connects a client session.
   */
  connectClientSessionSource = (call: ServerUnaryCall<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse>, done: sendUnaryData<webbffClientSessionIntegrationServiceApi.ConnectClientSessionSourceResponse>): void => {
    void this.workflow.connectClientSessionSource(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Disconnects a client session.
   */
  disconnectClientSessionSource = unary<webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceRequest, webbffClientSessionIntegrationServiceApi.DisconnectClientSessionSourceResponse>(
    (request) => this.workflow.disconnectClientSessionSource(request),
  );

  /**
   * Takes a stream of client sessions and answers once at the end.
   */
  ingestClientSessionEvents = clientStream<webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse>(
    (request) => this.workflow.ingestClientSessionEvents(request), () => webbffClientSessionIntegrationServiceApi.IngestClientSessionEventsResponse.fromPartial({}),
  );

  /**
   * Lists client sessions a page at a time.
   */
  listClientSessionSources = (call: ServerUnaryCall<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesRequest, webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse>, done: sendUnaryData<webbffClientSessionIntegrationServiceApi.ListClientSessionSourcesResponse>): void => {
    void this.workflow.listClientSessionSources(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Exchanges changes of client sessions with a peer.
   */
  relayClientSessionMessages = duplex<webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesRequest, webbffClientSessionIntegrationServiceApi.RelayClientSessionMessagesResponse>(
    (request) => this.workflow.relayClientSessionMessages(request),
  );

  /**
   * Replays a client session.
   */
  replayClientSessionEvents = unary<webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsRequest, webbffClientSessionIntegrationServiceApi.ReplayClientSessionEventsResponse>(
    (request) => this.workflow.replayClientSessionEvents(request),
  );

  /**
   * Tests a client session.
   */
  testClientSessionConnection = (call: ServerUnaryCall<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionRequest, webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse>, done: sendUnaryData<webbffClientSessionIntegrationServiceApi.TestClientSessionConnectionResponse>): void => {
    void this.workflow.testClientSessionConnection(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };
}

export function implementation(handler: ClientSessionIntegrationHandler): webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceServer {
  return {
    acknowledgeClientSessionEvent: handler.acknowledgeClientSessionEvent,
    connectClientSessionSource: handler.connectClientSessionSource,
    disconnectClientSessionSource: handler.disconnectClientSessionSource,
    ingestClientSessionEvents: handler.ingestClientSessionEvents,
    listClientSessionSources: handler.listClientSessionSources,
    relayClientSessionMessages: handler.relayClientSessionMessages,
    replayClientSessionEvents: handler.replayClientSessionEvents,
    testClientSessionConnection: handler.testClientSessionConnection,
  };
}
