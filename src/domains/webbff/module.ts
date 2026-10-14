/**
 * Register the webbff team's public gRPC boundary and workers.
 */

import * as contentContentBlockApprovalServiceApi from "../../../.cache/proto/acme/content/v1/content_block_approval_service.js";
import * as personalizationAffinitySyncServiceApi from "../../../.cache/proto/acme/personalization/v1/affinity_sync_service.js";
import * as searchSearchIndexQueryServiceApi from "../../../.cache/proto/acme/search/v1/search_index_query_service.js";
import * as webbffClientSessionIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_integration_service.js";
import * as webbffClientSessionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_notification_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import * as webbffPageCompositionGatewayServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_gateway_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import * as webbffPageCompositionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_query_service.js";
import * as webbffPageCompositionServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import * as webbffWidgetLayoutNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_notification_service.js";
import * as webbffWidgetLayoutQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_query_service.js";
import * as webbffWidgetLayoutServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_service.js";
import { ClientRegistry } from "../../platform/registry.js";
import { call, metadataFor } from "../../platform/rpc.js";
import { WorkQueue } from "../../platform/work-queue.js";
import {
  ClientSessionIntegrationHandler,
  implementation as bindClientSessionIntegrationHandler,
} from "./features/client-session/client-session-integration.handler.js";
import {
  PageCompositionGatewayHandler,
  implementation as bindPageCompositionGatewayHandler,
} from "./features/page-composition/page-composition-gateway.handler.js";
import {
  PageCompositionHandler,
  implementation as bindPageCompositionHandler,
} from "./features/page-composition/page-composition.handler.js";
import {
  WidgetLayoutQueryHandler,
  implementation as bindWidgetLayoutQueryHandler,
} from "./features/widget-layout/widget-layout-query.handler.js";
import {
  ClientSessionQueryHandler,
  implementation as bindClientSessionQueryHandler,
} from "./services/client-session-query.js";
import {
  PageCompositionQueryHandler,
  implementation as bindPageCompositionQueryHandler,
} from "./services/page-composition-query.js";
import {
  WidgetLayoutNotificationHandler,
  implementation as bindWidgetLayoutNotificationHandler,
} from "./services/widget-layout-notification.js";
import {
  ClientSessionNotificationHandler,
  implementation as bindClientSessionNotificationHandler,
} from "./transport/client-session-notification.js";
import {
  PageCompositionNotificationHandler,
  implementation as bindPageCompositionNotificationHandler,
} from "./transport/page-composition-notification.js";
import {
  WidgetLayoutIntegrationHandler,
  implementation as bindWidgetLayoutIntegrationHandler,
} from "./transport/widget-layout-integration.js";
import { WidgetLayoutHandler, implementation as bindWidgetLayoutHandler } from "./transport/widget-layout.js";
import { type Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function register(server: Server, scope: DependencyContainer): void {
  server.addService(webbffClientSessionIntegrationServiceApi.ClientSessionIntegrationServiceService, bindClientSessionIntegrationHandler(scope.resolve(ClientSessionIntegrationHandler)));
  server.addService(webbffClientSessionNotificationServiceApi.ClientSessionNotificationServiceService, bindClientSessionNotificationHandler(scope.resolve(ClientSessionNotificationHandler)));
  server.addService(webbffClientSessionQueryServiceApi.ClientSessionQueryServiceService, bindClientSessionQueryHandler(scope.resolve(ClientSessionQueryHandler)));
  server.addService(webbffPageCompositionGatewayServiceApi.PageCompositionGatewayServiceService, bindPageCompositionGatewayHandler(scope.resolve(PageCompositionGatewayHandler)));
  server.addService(webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceService, bindPageCompositionNotificationHandler(scope.resolve(PageCompositionNotificationHandler)));
  server.addService(webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceService, bindPageCompositionQueryHandler(scope.resolve(PageCompositionQueryHandler)));
  server.addService(webbffPageCompositionServiceApi.PageCompositionServiceService, bindPageCompositionHandler(scope.resolve(PageCompositionHandler)));
  server.addService(webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceService, bindWidgetLayoutIntegrationHandler(scope.resolve(WidgetLayoutIntegrationHandler)));
  server.addService(webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceService, bindWidgetLayoutNotificationHandler(scope.resolve(WidgetLayoutNotificationHandler)));
  server.addService(webbffWidgetLayoutQueryServiceApi.WidgetLayoutQueryServiceService, bindWidgetLayoutQueryHandler(scope.resolve(WidgetLayoutQueryHandler)));
  server.addService(webbffWidgetLayoutServiceApi.WidgetLayoutServiceService, bindWidgetLayoutHandler(scope.resolve(WidgetLayoutHandler)));
}

export function startWorkers(scope: DependencyContainer): void {
  const queue = scope.resolve<WorkQueue>("workQueue");
  const clients = scope.resolve<ClientRegistry>("clients");
  const client0 = clients.get<webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient>("acme.webbff.v1.PageCompositionNotificationService");
  queue.consume<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>("acme.webbff.v1.ClientSessionIntegrationService/ConnectClientSessionSource:1", async (request) =>
    call<webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersRequest, webbffPageCompositionNotificationServiceApi.NotifyPageCompositionWatchersResponse>((input, done) => client0.notifyPageCompositionWatchers(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client1 = clients.get<personalizationAffinitySyncServiceApi.AffinitySyncServiceClient>("acme.personalization.v1.AffinitySyncService");
  queue.consume<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>("acme.webbff.v1.ClientSessionNotificationService/SendClientSessionTestNotice:1", async (request) =>
    call<personalizationAffinitySyncServiceApi.ListAffinityConflictsRequest, personalizationAffinitySyncServiceApi.ListAffinityConflictsResponse>((input, done) => client1.listAffinityConflicts(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client2 = clients.get<contentContentBlockApprovalServiceApi.ContentBlockApprovalServiceClient>("acme.content.v1.ContentBlockApprovalService");
  queue.consume<contentContentBlockApprovalServiceApi.RecallContentBlockRequest, contentContentBlockApprovalServiceApi.RecallContentBlockResponse>("acme.webbff.v1.ClientSessionQueryService/FindClientSessions:0", async (request) =>
    call<contentContentBlockApprovalServiceApi.RecallContentBlockRequest, contentContentBlockApprovalServiceApi.RecallContentBlockResponse>((input, done) => client2.recallContentBlock(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client3 = clients.get<webbffPageCompositionQueryServiceApi.PageCompositionQueryServiceClient>("acme.webbff.v1.PageCompositionQueryService");
  queue.consume<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse>("acme.webbff.v1.PageCompositionGatewayService/StreamPageCompositionUpdates:2", async (request) =>
    call<webbffPageCompositionQueryServiceApi.FindPageCompositionsRequest, webbffPageCompositionQueryServiceApi.FindPageCompositionsResponse>((input, done) => client3.findPageCompositions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client4 = clients.get<webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient>("acme.webbff.v1.WidgetLayoutIntegrationService");
  queue.consume<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>("acme.webbff.v1.PageCompositionNotificationService/StreamPageCompositionNotices:0", async (request) =>
    call<webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventRequest, webbffWidgetLayoutIntegrationServiceApi.AcknowledgeWidgetLayoutEventResponse>((input, done) => client4.acknowledgeWidgetLayoutEvent(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client5 = clients.get<webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient>("acme.webbff.v1.WidgetLayoutNotificationService");
  queue.consume<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>("acme.webbff.v1.PageCompositionQueryService/SuggestPageCompositions:0", async (request) =>
    call<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>((input, done) => client5.listWidgetLayoutSubscriptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client6 = clients.get<webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient>("acme.webbff.v1.PageCompositionNotificationService");
  queue.consume<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>("acme.webbff.v1.PageCompositionService/UpdatePageComposition:2", async (request) =>
    call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>((input, done) => client6.subscribePageCompositionUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client7 = clients.get<searchSearchIndexQueryServiceApi.SearchIndexQueryServiceClient>("acme.search.v1.SearchIndexQueryService");
  queue.consume<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>("acme.webbff.v1.WidgetLayoutIntegrationService/RelayWidgetLayoutMessages:1", async (request) =>
    call<searchSearchIndexQueryServiceApi.SuggestSearchIndexesRequest, searchSearchIndexQueryServiceApi.SuggestSearchIndexesResponse>((input, done) => client7.suggestSearchIndexes(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client8 = clients.get<webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient>("acme.webbff.v1.PageCompositionNotificationService");
  queue.consume<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>("acme.webbff.v1.WidgetLayoutQueryService/ExportWidgetLayouts:2", async (request) =>
    call<webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.UnsubscribePageCompositionUpdatesResponse>((input, done) => client8.unsubscribePageCompositionUpdates(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
  const client9 = clients.get<webbffWidgetLayoutNotificationServiceApi.WidgetLayoutNotificationServiceClient>("acme.webbff.v1.WidgetLayoutNotificationService");
  queue.consume<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>("acme.webbff.v1.WidgetLayoutService/UpdateWidgetLayout:0", async (request) =>
    call<webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsRequest, webbffWidgetLayoutNotificationServiceApi.ListWidgetLayoutSubscriptionsResponse>((input, done) => client9.listWidgetLayoutSubscriptions(
      input, metadataFor(input.context), { deadline: Date.now() + 15_000 }, done), request),
  );
}
