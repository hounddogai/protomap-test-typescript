import * as bankingBankAccountServiceApi from "../../../.cache/proto/acme/banking/v1/bank_account_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as messagingParticipantLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayBankAccountStatus keeps of each CreateBankAccount response. */
interface ReplayBankAccountStatusRecord {
  status: string;
  message: string;
  correlationId: string;
  bankAccountId: string;
}

/** Where replayBankAccountStatus hands each record. */
interface ReplayBankAccountStatusDestination {
  push(record: ReplayBankAccountStatusRecord): Promise<void>;
}

/** Sends records to acme.messaging.v1.ParticipantLifecycleService. */
class ReplayBankAccountStatusParticipantLifecycle implements ReplayBankAccountStatusDestination {
  private readonly client: messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantLifecycleServiceApi.ParticipantLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayBankAccountStatusRecord): Promise<void> {
    await call<messagingParticipantLifecycleServiceApi.ActivateParticipantRequest, messagingParticipantLifecycleServiceApi.ActivateParticipantResponse>(
      (request, done) => this.client.activateParticipant(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingParticipantLifecycleServiceApi.ActivateParticipantRequest.fromPartial({ participantId: record.correlationId, reason: record.status, details: { reasonCode: record.message } }));
  }
}

/** Hands records to acme.messaging.v1.ChatMessageValidationService. */
class ReplayBankAccountStatusChatMessageValidation implements ReplayBankAccountStatusDestination {
  private readonly client: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: ReplayBankAccountStatusRecord): Promise<void> {
    await call<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse>(
      (request, done) => this.client.scoreChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      messagingChatMessageValidationServiceApi.ScoreChatMessageRequest.fromPartial({ chatMessageId: record.bankAccountId }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayBankAccountStatusLogOnly implements ReplayBankAccountStatusDestination {
  async push(record: ReplayBankAccountStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverReplayBankAccountStatus(kind: string, record: ReplayBankAccountStatusRecord, runtime: Runtime): Promise<void> {
  let sink: ReplayBankAccountStatusDestination = new ReplayBankAccountStatusLogOnly();
  switch (kind) {
    case "participant-lifecycle":
      sink = new ReplayBankAccountStatusParticipantLifecycle(runtime);
      break;
    case "chat-message-validation":
      sink = new ReplayBankAccountStatusChatMessageValidation(runtime);
      break;
  }
  await sink.push(record);
}

/** Reads acme.banking.v1.BankAccountService/CreateBankAccount and hands what it keeps to the sink of its kind. */
export async function replayBankAccountStatus(runtime: Runtime): Promise<void> {
  const source = new bankingBankAccountServiceApi.BankAccountServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<bankingBankAccountServiceApi.CreateBankAccountRequest, bankingBankAccountServiceApi.CreateBankAccountResponse>(
    (request, done) => source.createBankAccount(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    bankingBankAccountServiceApi.CreateBankAccountRequest.fromPartial({ requestId: "primary-replay-bank-account-status" })));
  const kept: ReplayBankAccountStatusRecord = {
    status: reply.result?.status ?? "",
    message: reply.result?.message ?? "",
    correlationId: reply.result?.correlationId ?? "",
    bankAccountId: reply.bankAccount?.bankAccountId ?? "",
  };
  await deliverReplayBankAccountStatus("chat-message-validation", kept, runtime);
}
