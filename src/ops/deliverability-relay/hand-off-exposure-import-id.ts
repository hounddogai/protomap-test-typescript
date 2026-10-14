import * as communityPostWorkflowServiceApi from "../../../.cache/proto/acme/community/v1/post_workflow_service.js";
import * as experimentsExposureImportServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_import_service.js";
import * as messagingChatMessageValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/chat_message_validation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffExposureImportId keeps of each RetryExposureImport response. */
interface HandOffExposureImportIdRecord {
  correlationId: string;
  message: string;
  status: string;
}

/** Where handOffExposureImportId hands each record. */
interface HandOffExposureImportIdTarget {
  apply(record: HandOffExposureImportIdRecord): Promise<void>;
}

/** Sends records to acme.notifications.v1.DeliveryAttemptValidationService. */
class HandOffExposureImportIdDeliveryAttemptValidation implements HandOffExposureImportIdTarget {
  private readonly client: notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffExposureImportIdRecord): Promise<void> {
    await call<notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest, notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptResponse>(
      (request, done) => this.client.previewDeliveryAttempt(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsDeliveryAttemptValidationServiceApi.PreviewDeliveryAttemptRequest.fromPartial({ deliveryAttemptId: record.correlationId, deliveryAttempt: { correlationId: record.status } }));
  }
}

/** Hands records to acme.messaging.v1.ChatMessageValidationService. */
class HandOffExposureImportIdChatMessageValidation implements HandOffExposureImportIdTarget {
  private readonly client: messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingChatMessageValidationServiceApi.ChatMessageValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffExposureImportIdRecord): Promise<void> {
    await call<messagingChatMessageValidationServiceApi.ScoreChatMessageRequest, messagingChatMessageValidationServiceApi.ScoreChatMessageResponse>(
      (request, done) => this.client.scoreChatMessage(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      messagingChatMessageValidationServiceApi.ScoreChatMessageRequest.fromPartial({ details: { currencyCode: record.correlationId }, chatMessage: { chatMessageId: record.status }, reason: record.message }));
  }
}

/** Sends records to acme.community.v1.PostWorkflowService. */
class HandOffExposureImportIdPostWorkflow implements HandOffExposureImportIdTarget {
  private readonly client: communityPostWorkflowServiceApi.PostWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostWorkflowServiceApi.PostWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: HandOffExposureImportIdRecord): Promise<void> {
    await call<communityPostWorkflowServiceApi.RetryPostWorkflowRequest, communityPostWorkflowServiceApi.RetryPostWorkflowResponse>(
      (request, done) => this.client.retryPostWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityPostWorkflowServiceApi.RetryPostWorkflowRequest.fromPartial({ post: { postId: record.correlationId } }));
  }
}

/**
 * Reads acme.experiments.v1.ExposureImportService/RetryExposureImport and hands what it keeps to the sink of
 * its kind.
 */
export async function handOffExposureImportId(runtime: Runtime): Promise<void> {
  const origin = new experimentsExposureImportServiceApi.ExposureImportServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<experimentsExposureImportServiceApi.RetryExposureImportRequest, experimentsExposureImportServiceApi.RetryExposureImportResponse>(
    (request, done) => origin.retryExposureImport(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    experimentsExposureImportServiceApi.RetryExposureImportRequest.fromPartial({ exposureId: "primary-hand-off-exposure-import-id" }));
  const entry: HandOffExposureImportIdRecord = {
    correlationId: text.normalize(found.exposure?.correlationId ?? ""),
    message: found.outcome?.message ?? "",
    status: found.result?.status ?? "",
  };
  const sinks: HandOffExposureImportIdTarget[] = [
    new HandOffExposureImportIdDeliveryAttemptValidation(runtime),
    new HandOffExposureImportIdChatMessageValidation(runtime),
    new HandOffExposureImportIdPostWorkflow(runtime),
  ];
  await sinks[2]!.apply(entry);
}
