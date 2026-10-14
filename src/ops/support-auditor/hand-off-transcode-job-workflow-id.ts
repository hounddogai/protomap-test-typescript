import * as formsFormSubmissionLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import * as mediaTranscodeJobWorkflowServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_workflow_service.js";
import * as messagingChatMessageCalculationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_calculation_service.js";
import * as secretsSecretQueryServiceApi from "../../../.cache/proto/acme/secrets/v1/secret_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffTranscodeJobWorkflowId keeps of each CancelTranscodeJobWorkflow response. */
interface HandOffTranscodeJobWorkflowIdRecord {
  transcodeJobId: string;
  subject: string;
  status: string;
}

/** Where handOffTranscodeJobWorkflowId hands each record. */
interface HandOffTranscodeJobWorkflowIdWriter {
  forward(record: HandOffTranscodeJobWorkflowIdRecord): Promise<void>;
}

/** Passes records to acme.forms.v1.FormSubmissionLifecycleService. */
class HandOffTranscodeJobWorkflowIdFormSubmissionLifecycle implements HandOffTranscodeJobWorkflowIdWriter {
  private readonly client: formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffTranscodeJobWorkflowIdRecord): Promise<void> {
    await call<formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest, formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleResponse>(
      (request, done) => this.client.getFormSubmissionLifecycle(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormSubmissionLifecycleServiceApi.GetFormSubmissionLifecycleRequest.fromPartial({ formSubmissionId: record.status }));
  }
}

/** Writes records to acme.messaging.v1.ChatMessageCalculationService. */
class HandOffTranscodeJobWorkflowIdChatMessageCalculation implements HandOffTranscodeJobWorkflowIdWriter {
  private readonly client: messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageCalculationServiceApi.ChatMessageCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffTranscodeJobWorkflowIdRecord): Promise<void> {
    await call<messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest, messagingChatMessageCalculationServiceApi.SimulateChatMessageResponse>(
      (request, done) => this.client.simulateChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingChatMessageCalculationServiceApi.SimulateChatMessageRequest.fromPartial({ chatMessage: { kind: record.subject }, reason: record.status }));
  }
}

/** Hands records to acme.secrets.v1.SecretQueryService. */
class HandOffTranscodeJobWorkflowIdSecretQuery implements HandOffTranscodeJobWorkflowIdWriter {
  private readonly client: secretsSecretQueryServiceApi.SecretQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new secretsSecretQueryServiceApi.SecretQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: HandOffTranscodeJobWorkflowIdRecord): Promise<void> {
    await call<secretsSecretQueryServiceApi.PeekSecretRequest, secretsSecretQueryServiceApi.PeekSecretResponse>(
      (request, done) => this.client.peekSecret(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      secretsSecretQueryServiceApi.PeekSecretRequest.fromPartial({ secretId: record.subject }));
  }
}

/** Only logs, for kinds no service takes yet. */
class HandOffTranscodeJobWorkflowIdLogOnly implements HandOffTranscodeJobWorkflowIdWriter {
  async forward(record: HandOffTranscodeJobWorkflowIdRecord): Promise<void> {
    console.info("no sink for record", record.transcodeJobId);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverHandOffTranscodeJobWorkflowId(kind: string, record: HandOffTranscodeJobWorkflowIdRecord, runtime: Runtime): Promise<void> {
  let sink: HandOffTranscodeJobWorkflowIdWriter = new HandOffTranscodeJobWorkflowIdLogOnly();
  switch (kind) {
    case "form-submission-lifecycle":
      sink = new HandOffTranscodeJobWorkflowIdFormSubmissionLifecycle(runtime);
      break;
    case "chat-message-calculation":
      sink = new HandOffTranscodeJobWorkflowIdChatMessageCalculation(runtime);
      break;
    case "secret-query":
      sink = new HandOffTranscodeJobWorkflowIdSecretQuery(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.media.v1.TranscodeJobWorkflowService/CancelTranscodeJobWorkflow and hands what it keeps to the
 * sink of its kind.
 */
export async function handOffTranscodeJobWorkflowId(runtime: Runtime): Promise<void> {
  const reader = new mediaTranscodeJobWorkflowServiceApi.TranscodeJobWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowRequest, mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowResponse>(
    (request, done) => reader.cancelTranscodeJobWorkflow(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    mediaTranscodeJobWorkflowServiceApi.CancelTranscodeJobWorkflowRequest.fromPartial({ reason: "nightly-hand-off-transcode-job-workflow-id" }));
  const row: HandOffTranscodeJobWorkflowIdRecord = {
    transcodeJobId: text.normalize(reply.transcodeJob?.transcodeJobId ?? ""),
    subject: reply.transcodeJob?.subject ?? "",
    status: text.normalize(reply.outcome?.status ?? ""),
  };
  await deliverHandOffTranscodeJobWorkflowId("secret-query", row, runtime);
}
