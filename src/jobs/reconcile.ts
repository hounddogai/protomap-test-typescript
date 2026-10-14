import "reflect-metadata";
/**
 * The reconcile job refreshes downstream views from paged records.
 */

import * as audiencesAudienceServiceApi from "../../.cache/proto/acme/audiences/v1/audience_service.js";
import * as campaignsMarketingCampaignServiceApi from "../../.cache/proto/acme/campaigns/v1/marketing_campaign_service.js";
import * as chatChatRoomServiceApi from "../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as communityForumServiceApi from "../../.cache/proto/acme/community/v1/forum_service.js";
import { configuration } from "../platform/config.js";
import { createApplication } from "../platform/container.js";
import { ClientRegistry } from "../platform/registry.js";
import { call } from "../platform/rpc.js";
import { Metadata } from "@grpc/grpc-js";

const config = configuration();
const app = createApplication(config);
const clients = app.scope.resolve<ClientRegistry>("clients");
const metadata = new Metadata();
metadata.set("authorization", `Bearer ${config.serviceToken}`);
metadata.set("x-tenant-id", config.tenant);
// The program acts with the server's credential, as its service account, which the servers downstream require.
const actor = { userId: "engagement-reconcile", serviceAccount: true };
try {
  const client0 = clients.get<audiencesAudienceServiceApi.AudienceServiceClient>("acme.audiences.v1.AudienceService");
  let pageToken0 = "";
  do {
    const page = await call<audiencesAudienceServiceApi.ListAudiencesRequest, audiencesAudienceServiceApi.ListAudiencesResponse>((request, done) =>
      client0.listAudiences(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceServiceApi.ListAudiencesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken0 } }));
    await Promise.all(page.audiences.map(async (record) => {
      await call<audiencesAudienceServiceApi.GetAudienceRequest, audiencesAudienceServiceApi.GetAudienceResponse>((request, done) =>
        client0.getAudience(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceServiceApi.GetAudienceRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceId: record.audienceId }));
    }));
    pageToken0 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken0);
  const client1 = clients.get<audiencesAudienceServiceApi.AudienceServiceClient>("acme.audiences.v1.AudienceService");
  let pageToken1 = "";
  do {
    const page = await call<audiencesAudienceServiceApi.SearchAudiencesRequest, audiencesAudienceServiceApi.SearchAudiencesResponse>((request, done) =>
      client1.searchAudiences(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceServiceApi.SearchAudiencesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken1 } }));
    await Promise.all(page.audiences.map(async (record) => {
      await call<audiencesAudienceServiceApi.GetAudienceRequest, audiencesAudienceServiceApi.GetAudienceResponse>((request, done) =>
        client1.getAudience(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceServiceApi.GetAudienceRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceId: record.audienceId }));
    }));
    pageToken1 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken1);
  const client2 = clients.get<campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient>("acme.campaigns.v1.MarketingCampaignService");
  let pageToken2 = "";
  do {
    const page = await call<campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.ListMarketingCampaignsResponse>((request, done) =>
      client2.listMarketingCampaigns(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      campaignsMarketingCampaignServiceApi.ListMarketingCampaignsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken2 } }));
    await Promise.all(page.marketingCampaigns.map(async (record) => {
      await call<campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse>((request, done) =>
        client2.getMarketingCampaign(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          marketingCampaignId: record.marketingCampaignId }));
    }));
    pageToken2 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken2);
  const client3 = clients.get<campaignsMarketingCampaignServiceApi.MarketingCampaignServiceClient>("acme.campaigns.v1.MarketingCampaignService");
  let pageToken3 = "";
  do {
    const page = await call<campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest, campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsResponse>((request, done) =>
      client3.searchMarketingCampaigns(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      campaignsMarketingCampaignServiceApi.SearchMarketingCampaignsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken3 } }));
    await Promise.all(page.marketingCampaigns.map(async (record) => {
      await call<campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest, campaignsMarketingCampaignServiceApi.GetMarketingCampaignResponse>((request, done) =>
        client3.getMarketingCampaign(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        campaignsMarketingCampaignServiceApi.GetMarketingCampaignRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          marketingCampaignId: record.marketingCampaignId }));
    }));
    pageToken3 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken3);
  const client4 = clients.get<chatChatRoomServiceApi.ChatRoomServiceClient>("acme.chat.v1.ChatRoomService");
  let pageToken4 = "";
  do {
    const page = await call<chatChatRoomServiceApi.ListChatRoomsRequest, chatChatRoomServiceApi.ListChatRoomsResponse>((request, done) =>
      client4.listChatRooms(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      chatChatRoomServiceApi.ListChatRoomsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken4 } }));
    await Promise.all(page.chatRooms.map(async (record) => {
      await call<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse>((request, done) =>
        client4.getChatRoom(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        chatChatRoomServiceApi.GetChatRoomRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          chatRoomId: record.chatRoomId }));
    }));
    pageToken4 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken4);
  const client5 = clients.get<chatChatRoomServiceApi.ChatRoomServiceClient>("acme.chat.v1.ChatRoomService");
  let pageToken5 = "";
  do {
    const page = await call<chatChatRoomServiceApi.SearchChatRoomsRequest, chatChatRoomServiceApi.SearchChatRoomsResponse>((request, done) =>
      client5.searchChatRooms(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      chatChatRoomServiceApi.SearchChatRoomsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken5 } }));
    await Promise.all(page.chatRooms.map(async (record) => {
      await call<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse>((request, done) =>
        client5.getChatRoom(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        chatChatRoomServiceApi.GetChatRoomRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          chatRoomId: record.chatRoomId }));
    }));
    pageToken5 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken5);
  const client6 = clients.get<communityForumServiceApi.ForumServiceClient>("acme.community.v1.ForumService");
  let pageToken6 = "";
  do {
    const page = await call<communityForumServiceApi.ListForumsRequest, communityForumServiceApi.ListForumsResponse>((request, done) =>
      client6.listForums(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      communityForumServiceApi.ListForumsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken6 } }));
    await Promise.all(page.forums.map(async (record) => {
      await call<communityForumServiceApi.GetForumRequest, communityForumServiceApi.GetForumResponse>((request, done) =>
        client6.getForum(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        communityForumServiceApi.GetForumRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          forumId: record.forumId }));
    }));
    pageToken6 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken6);
  const client7 = clients.get<communityForumServiceApi.ForumServiceClient>("acme.community.v1.ForumService");
  let pageToken7 = "";
  do {
    const page = await call<communityForumServiceApi.SearchForumsRequest, communityForumServiceApi.SearchForumsResponse>((request, done) =>
      client7.searchForums(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      communityForumServiceApi.SearchForumsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken7 } }));
    await Promise.all(page.forums.map(async (record) => {
      await call<communityForumServiceApi.GetForumRequest, communityForumServiceApi.GetForumResponse>((request, done) =>
        client7.getForum(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        communityForumServiceApi.GetForumRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          forumId: record.forumId }));
    }));
    pageToken7 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken7);
} finally { await app.close(); }
