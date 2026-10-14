import * as billingBillingAccountQueryServiceApi from "../../../.cache/proto/acme/billing/v1/billing_account_query_service.js";
import * as communityForumApprovalServiceApi from "../../../.cache/proto/acme/community/v1/forum_approval_service.js";
import * as formsFormFieldCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_field_calculation_service.js";
import * as messagingConversationLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/conversation_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillConversationLifecycleId keeps of each GetConversationLifecycle response. */
interface BackfillConversationLifecycleIdRecord {
  conversationId: string;
  correlationId: string;
}

/** Where backfillConversationLifecycleId hands each record. */
interface BackfillConversationLifecycleIdTarget {
  apply(record: BackfillConversationLifecycleIdRecord): Promise<void>;
}

/** Writes records to acme.forms.v1.FormFieldCalculationService. */
class BackfillConversationLifecycleIdFormFieldCalculation implements BackfillConversationLifecycleIdTarget {
  private readonly client: formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormFieldCalculationServiceApi.FormFieldCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillConversationLifecycleIdRecord): Promise<void> {
    await retry(() => call<formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest, formsFormFieldCalculationServiceApi.GetFormFieldRatesResponse>(
      (request, done) => this.client.getFormFieldRates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      formsFormFieldCalculationServiceApi.GetFormFieldRatesRequest.fromPartial({ formFieldId: record.correlationId })));
  }
}

/** Sends records to acme.community.v1.ForumApprovalService. */
class BackfillConversationLifecycleIdForumApproval implements BackfillConversationLifecycleIdTarget {
  private readonly client: communityForumApprovalServiceApi.ForumApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityForumApprovalServiceApi.ForumApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillConversationLifecycleIdRecord): Promise<void> {
    await retry(() => call<communityForumApprovalServiceApi.SubmitForumRequest, communityForumApprovalServiceApi.SubmitForumResponse>(
      (request, done) => this.client.submitForum(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      communityForumApprovalServiceApi.SubmitForumRequest.fromPartial({ forum: { parentId: record.correlationId } })));
  }
}

/** Hands records to acme.billing.v1.BillingAccountQueryService. */
class BackfillConversationLifecycleIdBillingAccountQuery implements BackfillConversationLifecycleIdTarget {
  private readonly client: billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new billingBillingAccountQueryServiceApi.BillingAccountQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: BackfillConversationLifecycleIdRecord): Promise<void> {
    await call<billingBillingAccountQueryServiceApi.CountBillingAccountsRequest, billingBillingAccountQueryServiceApi.CountBillingAccountsResponse>(
      (request, done) => this.client.countBillingAccounts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      billingBillingAccountQueryServiceApi.CountBillingAccountsRequest.fromPartial({ orderBy: record.correlationId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillConversationLifecycleIdLogOnly implements BackfillConversationLifecycleIdTarget {
  async apply(record: BackfillConversationLifecycleIdRecord): Promise<void> {
    console.info("no sink for record", record.conversationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchBackfillConversationLifecycleId(kind: string, record: BackfillConversationLifecycleIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: BackfillConversationLifecycleIdRecord): Promise<void> => new BackfillConversationLifecycleIdLogOnly().apply(item);
  switch (kind) {
    case "form-field-calculation":
      write = (item) => new BackfillConversationLifecycleIdFormFieldCalculation(runtime).apply(item);
      break;
    case "forum-approval":
      write = (item) => new BackfillConversationLifecycleIdForumApproval(runtime).apply(item);
      break;
    case "billing-account-query":
      write = (item) => new BackfillConversationLifecycleIdBillingAccountQuery(runtime).apply(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.messaging.v1.ConversationLifecycleService/GetConversationLifecycle and hands what it keeps to
 * the sink of its kind.
 */
export async function backfillConversationLifecycleId(runtime: Runtime): Promise<void> {
  const origin = new messagingConversationLifecycleServiceApi.ConversationLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<messagingConversationLifecycleServiceApi.GetConversationLifecycleRequest, messagingConversationLifecycleServiceApi.GetConversationLifecycleResponse>(
    (request, done) => origin.getConversationLifecycle(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    messagingConversationLifecycleServiceApi.GetConversationLifecycleRequest.fromPartial({ conversationId: "live-backfill-conversation-lifecycle-id" })));
  const record: BackfillConversationLifecycleIdRecord = {
    conversationId: current.conversation?.conversationId ?? "",
    correlationId: current.result?.correlationId ?? "",
  };
  await dispatchBackfillConversationLifecycleId("forum-approval", record, runtime);
}
