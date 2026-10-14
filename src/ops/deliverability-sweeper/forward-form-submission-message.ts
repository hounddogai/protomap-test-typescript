import * as careplansCarePlanCalculationServiceApi from "../../../.cache/proto/acme/careplans/v1/care_plan_calculation_service.js";
import * as chatChatBotLifecycleServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_lifecycle_service.js";
import * as formsFormSubmissionLifecycleServiceApi from "../../../.cache/proto/acme/forms/v1/form_submission_lifecycle_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardFormSubmissionMessage keeps of each ReinstateFormSubmission response. */
interface ForwardFormSubmissionMessageRecord {
  message: string;
  referenceId: string;
  source: string;
}

/** Where forwardFormSubmissionMessage hands each record. */
interface ForwardFormSubmissionMessageDestination {
  forward(record: ForwardFormSubmissionMessageRecord): Promise<void>;
}

/** Sends records to acme.careplans.v1.CarePlanCalculationService. */
class ForwardFormSubmissionMessageCarePlanCalculation implements ForwardFormSubmissionMessageDestination {
  private readonly client: careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new careplansCarePlanCalculationServiceApi.CarePlanCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardFormSubmissionMessageRecord): Promise<void> {
    await call<careplansCarePlanCalculationServiceApi.RecalculateCarePlansRequest, careplansCarePlanCalculationServiceApi.RecalculateCarePlansResponse>(
      (request, done) => this.client.recalculateCarePlans(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      careplansCarePlanCalculationServiceApi.RecalculateCarePlansRequest.fromPartial({ carePlan: { number: record.message } }));
  }
}

/** Hands records to acme.chat.v1.ChatBotLifecycleService. */
class ForwardFormSubmissionMessageChatBotLifecycle implements ForwardFormSubmissionMessageDestination {
  private readonly client: chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotLifecycleServiceApi.ChatBotLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardFormSubmissionMessageRecord): Promise<void> {
    await call<chatChatBotLifecycleServiceApi.TerminateChatBotRequest, chatChatBotLifecycleServiceApi.TerminateChatBotResponse>(
      (request, done) => this.client.terminateChatBot(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatBotLifecycleServiceApi.TerminateChatBotRequest.fromPartial({ reason: record.referenceId, chatBotId: record.message }));
  }
}

/** Hands records to acme.forms.v1.FormSubmissionLifecycleService. */
class ForwardFormSubmissionMessageFormSubmissionLifecycle implements ForwardFormSubmissionMessageDestination {
  private readonly client: formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardFormSubmissionMessageRecord): Promise<void> {
    await call<formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionResponse>(
      (request, done) => this.client.expireFormSubmission(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      formsFormSubmissionLifecycleServiceApi.ExpireFormSubmissionRequest.fromPartial({ formSubmissionId: record.message }));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardFormSubmissionMessageLogOnly implements ForwardFormSubmissionMessageDestination {
  async forward(record: ForwardFormSubmissionMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchForwardFormSubmissionMessage(kind: string, record: ForwardFormSubmissionMessageRecord, runtime: Runtime): Promise<void> {
  let write = (item: ForwardFormSubmissionMessageRecord): Promise<void> => new ForwardFormSubmissionMessageLogOnly().forward(item);
  switch (kind) {
    case "care-plan-calculation":
      write = (item) => new ForwardFormSubmissionMessageCarePlanCalculation(runtime).forward(item);
      break;
    case "chat-bot-lifecycle":
      write = (item) => new ForwardFormSubmissionMessageChatBotLifecycle(runtime).forward(item);
      break;
    case "form-submission-lifecycle":
      write = (item) => new ForwardFormSubmissionMessageFormSubmissionLifecycle(runtime).forward(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.forms.v1.FormSubmissionLifecycleService/ReinstateFormSubmission and hands what it keeps to the
 * sink of its kind.
 */
export async function forwardFormSubmissionMessage(runtime: Runtime): Promise<void> {
  const upstream = new formsFormSubmissionLifecycleServiceApi.FormSubmissionLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await retry(() => call<formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest, formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionResponse>(
    (request, done) => upstream.reinstateFormSubmission(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    formsFormSubmissionLifecycleServiceApi.ReinstateFormSubmissionRequest.fromPartial({ reason: "live-forward-form-submission-message" })));
  const entry: ForwardFormSubmissionMessageRecord = {
    message: response.result?.message ?? "",
    referenceId: response.outcome?.referenceId ?? "",
    source: response.formSubmission?.source ?? "",
  };
  await dispatchForwardFormSubmissionMessage("chat-bot-lifecycle", entry, runtime);
}
