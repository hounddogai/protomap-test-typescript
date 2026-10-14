/**
 * Connects external systems that send widget layout events.
 */

import * as webbffWidgetLayoutIntegrationServiceApi from "../../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import { serviceError } from "../../../platform/errors.js";
import { clientStream, duplex, unary } from "../../../platform/handlers.js";
import { WidgetLayoutIntegrationWorkflow } from "../application/widget-layout-integration.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for WidgetLayoutIntegrationService; workflows own validation and database transactions.
 */
@injectable()
export class WidgetLayoutIntegrationHandler {
  constructor(@inject(WidgetLayoutIntegrationWorkflow) private readonly workflow: WidgetLayoutIntegrationWorkflow) {}

  /**
   * Acknowledges a widget layout.
   */
  acknowledgeWidgetLayoutEvent = (call: ServerUnaryCall<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>, done: sendUnaryData<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>): void => {
    void this.workflow.acknowledgeWidgetLayoutEvent(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Connects a widget layout.
   */
  connectWidgetLayoutSource = unary<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse>(
    (request) => this.workflow.connectWidgetLayoutSource(request),
  );

  /**
   * Disconnects a widget layout.
   */
  disconnectWidgetLayoutSource = unary<webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.DisconnectWidgetLayoutSourceResponse>(
    (request) => this.workflow.disconnectWidgetLayoutSource(request),
  );

  /**
   * Takes a stream of widget layouts and answers once at the end.
   */
  ingestWidgetLayoutEvents = clientStream<webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsRequest, webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse>(
    (request) => this.workflow.ingestWidgetLayoutEvents(request), () => webbffWidgetLayoutIntegrationServiceApi.IngestWidgetLayoutEventsResponse.fromPartial({}),
  );

  /**
   * Exchanges changes of widget layouts with a peer.
   */
  relayWidgetLayoutMessages = duplex<webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesRequest, webbffWidgetLayoutIntegrationServiceApi.RelayWidgetLayoutMessagesResponse>(
    (request) => this.workflow.relayWidgetLayoutMessages(request),
  );

  /**
   * Tests a widget layout.
   */
  testWidgetLayoutConnection = unary<webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionRequest, webbffWidgetLayoutIntegrationServiceApi.TestWidgetLayoutConnectionResponse>(
    (request) => this.workflow.testWidgetLayoutConnection(request),
  );
}

export function implementation(handler: WidgetLayoutIntegrationHandler): webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceServer {
  return {
    acknowledgeWidgetLayoutEvent: handler.acknowledgeWidgetLayoutEvent,
    connectWidgetLayoutSource: handler.connectWidgetLayoutSource,
    disconnectWidgetLayoutSource: handler.disconnectWidgetLayoutSource,
    ingestWidgetLayoutEvents: handler.ingestWidgetLayoutEvents,
    relayWidgetLayoutMessages: handler.relayWidgetLayoutMessages,
    testWidgetLayoutConnection: handler.testWidgetLayoutConnection,
  };
}
