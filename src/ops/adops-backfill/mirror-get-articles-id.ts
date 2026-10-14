import * as audiencesAudienceMemberValidationServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as chatHandoffSyncServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_sync_service.js";
import * as contentArticleServiceApi from "../../../.cache/proto/acme/content/v1/article_service.js";
import * as webbffPageCompositionNotificationServiceApi from "../../../.cache/proto/acme/webbff/v1/page_composition_notification_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorGetArticlesId keeps of each BatchGetArticles response. */
interface MirrorGetArticlesIdRecord {
  correlationId: string;
  nextPageToken: string;
}

/** Where mirrorGetArticlesId hands each record. */
interface MirrorGetArticlesIdTarget {
  write(record: MirrorGetArticlesIdRecord): Promise<void>;
}

/** Hands records to acme.webbff.v1.PageCompositionNotificationService. */
class MirrorGetArticlesIdPageCompositionNotification implements MirrorGetArticlesIdTarget {
  private readonly client: webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new webbffPageCompositionNotificationServiceApi.PageCompositionNotificationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorGetArticlesIdRecord): Promise<void> {
    await retry(() => call<webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest, webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesResponse>(
      (request, done) => this.client.subscribePageCompositionUpdates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      webbffPageCompositionNotificationServiceApi.SubscribePageCompositionUpdatesRequest.fromPartial({ pageCompositionId: record.correlationId })));
  }
}

/** Sends records to acme.chat.v1.HandoffSyncService. */
class MirrorGetArticlesIdHandoffSync implements MirrorGetArticlesIdTarget {
  private readonly client: chatHandoffSyncServiceApi.HandoffSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffSyncServiceApi.HandoffSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorGetArticlesIdRecord): Promise<void> {
    await call<chatHandoffSyncServiceApi.SyncHandoffsRequest, chatHandoffSyncServiceApi.SyncHandoffsResponse>(
      (request, done) => this.client.syncHandoffs(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatHandoffSyncServiceApi.SyncHandoffsRequest.fromPartial({ handoffId: record.correlationId, details: { cursor: record.nextPageToken } }));
  }
}

/** Sends records to acme.audiences.v1.AudienceMemberValidationService. */
class MirrorGetArticlesIdAudienceMemberValidation implements MirrorGetArticlesIdTarget {
  private readonly client: audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: MirrorGetArticlesIdRecord): Promise<void> {
    await call<audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest, audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberResponse>(
      (request, done) => this.client.normalizeAudienceMember(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      audiencesAudienceMemberValidationServiceApi.NormalizeAudienceMemberRequest.fromPartial({ audienceMember: { audienceMemberId: record.nextPageToken } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorGetArticlesIdLogOnly implements MirrorGetArticlesIdTarget {
  async write(record: MirrorGetArticlesIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverMirrorGetArticlesId(kind: string, record: MirrorGetArticlesIdRecord, runtime: Runtime): Promise<void> {
  let sink: MirrorGetArticlesIdTarget = new MirrorGetArticlesIdLogOnly();
  switch (kind) {
    case "page-composition-notification":
      sink = new MirrorGetArticlesIdPageCompositionNotification(runtime);
      break;
    case "handoff-sync":
      sink = new MirrorGetArticlesIdHandoffSync(runtime);
      break;
    case "audience-member-validation":
      sink = new MirrorGetArticlesIdAudienceMemberValidation(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.content.v1.ArticleService/BatchGetArticles and hands what it keeps to the sink of its kind. */
export async function mirrorGetArticlesId(runtime: Runtime): Promise<void> {
  const source = new contentArticleServiceApi.ArticleServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<contentArticleServiceApi.BatchGetArticlesRequest, contentArticleServiceApi.BatchGetArticlesResponse>(
    (request, done) => source.batchGetArticles(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    contentArticleServiceApi.BatchGetArticlesRequest.fromPartial({})));
  const entry: MirrorGetArticlesIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  await deliverMirrorGetArticlesId("page-composition-notification", entry, runtime);
}
