import * as broadcastsBroadcastServiceApi from "../../../.cache/proto/acme/broadcasts/v1/broadcast_service.js";
import * as chatChatRoomWorkflowServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_workflow_service.js";
import * as promotionsPromotionServiceApi from "../../../.cache/proto/acme/promotions/v1/promotion_service.js";
import * as surveysQuestionCalculationServiceApi from "../../../.cache/proto/acme/surveys/v1/question_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What pushQuestionMessage keeps of each EstimateQuestion response. */
interface PushQuestionMessageRecord {
  message: string;
  name: string;
  questionId: string;
}

/** Where pushQuestionMessage hands each record. */
interface PushQuestionMessageSink {
  deliver(record: PushQuestionMessageRecord): Promise<void>;
}

/** Sends records to acme.promotions.v1.PromotionService. */
class PushQuestionMessagePromotion implements PushQuestionMessageSink {
  private readonly client: promotionsPromotionServiceApi.PromotionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new promotionsPromotionServiceApi.PromotionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushQuestionMessageRecord): Promise<void> {
    await call<promotionsPromotionServiceApi.ClonePromotionRequest, promotionsPromotionServiceApi.ClonePromotionResponse>(
      (request, done) => this.client.clonePromotion(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      promotionsPromotionServiceApi.ClonePromotionRequest.fromPartial({ promotion: { promotionId: record.message } }));
  }
}

/** Sends records to acme.chat.v1.ChatRoomWorkflowService. */
class PushQuestionMessageChatRoomWorkflow implements PushQuestionMessageSink {
  private readonly client: chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatRoomWorkflowServiceApi.ChatRoomWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushQuestionMessageRecord): Promise<void> {
    await call<chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowRequest, chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowResponse>(
      (request, done) => this.client.pauseChatRoomWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      chatChatRoomWorkflowServiceApi.PauseChatRoomWorkflowRequest.fromPartial({ chatRoom: { code: record.message } }));
  }
}

/** Sends records to acme.broadcasts.v1.BroadcastService. */
class PushQuestionMessageBroadcast implements PushQuestionMessageSink {
  private readonly client: broadcastsBroadcastServiceApi.BroadcastServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new broadcastsBroadcastServiceApi.BroadcastServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: PushQuestionMessageRecord): Promise<void> {
    await call<broadcastsBroadcastServiceApi.UpdateBroadcastRequest, broadcastsBroadcastServiceApi.UpdateBroadcastResponse>(
      (request, done) => this.client.updateBroadcast(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      broadcastsBroadcastServiceApi.UpdateBroadcastRequest.fromPartial({ broadcast: { broadcastId: record.name } }));
  }
}

/** Runs the action registered for kind. */
async function actOnPushQuestionMessage(kind: string, record: PushQuestionMessageRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "promotion": () => new PushQuestionMessagePromotion(runtime).deliver(record),
    "chat-room-workflow": () => new PushQuestionMessageChatRoomWorkflow(runtime).deliver(record),
    "broadcast": () => new PushQuestionMessageBroadcast(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.surveys.v1.QuestionCalculationService/EstimateQuestion and hands what it keeps to the sink of
 * its kind.
 */
export async function pushQuestionMessage(runtime: Runtime): Promise<void> {
  const source = new surveysQuestionCalculationServiceApi.QuestionCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<surveysQuestionCalculationServiceApi.EstimateQuestionRequest, surveysQuestionCalculationServiceApi.EstimateQuestionResponse>(
    (request, done) => source.estimateQuestion(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    surveysQuestionCalculationServiceApi.EstimateQuestionRequest.fromPartial({ reason: "main-push-question-message" }));
  const kept: PushQuestionMessageRecord = {
    message: found.result?.message ?? "",
    name: found.question?.name ?? "",
    questionId: text.normalize(found.question?.questionId ?? ""),
  };
  await actOnPushQuestionMessage("broadcast", kept, runtime);
}
