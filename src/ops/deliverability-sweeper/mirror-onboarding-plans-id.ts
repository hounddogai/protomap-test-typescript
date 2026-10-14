import * as chatChatBotValidationServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_validation_service.js";
import * as experimentsExposureCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/exposure_calculation_service.js";
import * as onboardingOnboardingPlanQueryServiceApi from "../../../.cache/proto/acme/onboarding/v1/onboarding_plan_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorOnboardingPlansId keeps of each SuggestOnboardingPlans response. */
interface MirrorOnboardingPlansIdRecord {
  correlationId: string;
  message: string;
  nextPageToken: string;
  status: string;
}

/** Where mirrorOnboardingPlansId hands each record. */
interface MirrorOnboardingPlansIdWriter {
  push(record: MirrorOnboardingPlansIdRecord): Promise<void>;
}

/** Sends records to acme.chat.v1.ChatBotValidationService. */
class MirrorOnboardingPlansIdChatBotValidation implements MirrorOnboardingPlansIdWriter {
  private readonly client: chatChatBotValidationServiceApi.ChatBotValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotValidationServiceApi.ChatBotValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: MirrorOnboardingPlansIdRecord): Promise<void> {
    await retry(() => call<chatChatBotValidationServiceApi.ScoreChatBotRequest, chatChatBotValidationServiceApi.ScoreChatBotResponse>(
      (request, done) => this.client.scoreChatBot(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      chatChatBotValidationServiceApi.ScoreChatBotRequest.fromPartial({ reason: record.message })));
  }
}

/** Passes records to acme.experiments.v1.ExposureCalculationService. */
class MirrorOnboardingPlansIdExposureCalculation implements MirrorOnboardingPlansIdWriter {
  private readonly client: experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExposureCalculationServiceApi.ExposureCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: MirrorOnboardingPlansIdRecord): Promise<void> {
    await retry(() => call<experimentsExposureCalculationServiceApi.SimulateExposureRequest, experimentsExposureCalculationServiceApi.SimulateExposureResponse>(
      (request, done) => this.client.simulateExposure(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExposureCalculationServiceApi.SimulateExposureRequest.fromPartial({ exposureId: record.correlationId, exposure: { kind: record.message, exposureId: record.status } })));
  }
}

/** Runs the action registered for kind. */
async function actOnMirrorOnboardingPlansId(kind: string, record: MirrorOnboardingPlansIdRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "chat-bot-validation": () => new MirrorOnboardingPlansIdChatBotValidation(runtime).push(record),
    "exposure-calculation": () => new MirrorOnboardingPlansIdExposureCalculation(runtime).push(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.onboarding.v1.OnboardingPlanQueryService/SuggestOnboardingPlans and hands what it keeps to the
 * sink of its kind.
 */
export async function mirrorOnboardingPlansId(runtime: Runtime): Promise<void> {
  const source = new onboardingOnboardingPlanQueryServiceApi.OnboardingPlanQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<onboardingOnboardingPlanQueryServiceApi.SuggestOnboardingPlansRequest, onboardingOnboardingPlanQueryServiceApi.SuggestOnboardingPlansResponse>(
    (request, done) => source.suggestOnboardingPlans(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    onboardingOnboardingPlanQueryServiceApi.SuggestOnboardingPlansRequest.fromPartial({ orderBy: "default-mirror-onboarding-plans-id" })));
  const kept: MirrorOnboardingPlansIdRecord = {
    correlationId: text.normalize(found.result?.correlationId ?? ""),
    message: found.result?.message ?? "",
    nextPageToken: text.normalize(found.pageInfo?.nextPageToken ?? ""),
    status: found.result?.status ?? "",
  };
  await actOnMirrorOnboardingPlansId("chat-bot-validation", kept, runtime);
}
