import * as fanportalFanSessionServiceApi from "../../../.cache/proto/acme/fanportal/v1/fan_session_service.js";
import * as helpdeskTicketCalculationServiceApi from "../../../.cache/proto/acme/helpdesk/v1/ticket_calculation_service.js";
import * as messagingChannelLifecycleServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_lifecycle_service.js";
import * as onboardingOnboardingPlanQueryServiceApi from "../../../.cache/proto/acme/onboarding/v1/onboarding_plan_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardChannelName keeps of each ExpireChannel response. */
interface ForwardChannelNameRecord {
  name: string;
  message: string;
  status: string;
  resultStatus: string;
}

/** Where forwardChannelName hands each record. */
interface ForwardChannelNameSink {
  deliver(record: ForwardChannelNameRecord): Promise<void>;
}

/** Sends records to acme.helpdesk.v1.TicketCalculationService. */
class ForwardChannelNameTicketCalculation implements ForwardChannelNameSink {
  private readonly client: helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new helpdeskTicketCalculationServiceApi.TicketCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardChannelNameRecord): Promise<void> {
    await retry(() => call<helpdeskTicketCalculationServiceApi.CalculateTicketRequest, helpdeskTicketCalculationServiceApi.CalculateTicketResponse>(
      (request, done) => this.client.calculateTicket(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      helpdeskTicketCalculationServiceApi.CalculateTicketRequest.fromPartial({ ticketId: record.status, ticket: { ticketId: record.message }, reason: record.name })));
  }
}

/** Passes records to acme.fanportal.v1.FanSessionService. */
class ForwardChannelNameFanSession implements ForwardChannelNameSink {
  private readonly client: fanportalFanSessionServiceApi.FanSessionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new fanportalFanSessionServiceApi.FanSessionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardChannelNameRecord): Promise<void> {
    await call<fanportalFanSessionServiceApi.ListFanSessionsRequest, fanportalFanSessionServiceApi.ListFanSessionsResponse>(
      (request, done) => this.client.listFanSessions(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      fanportalFanSessionServiceApi.ListFanSessionsRequest.fromPartial({ page: { pageToken: record.message }, orderBy: record.resultStatus }));
  }
}

/** Passes records to acme.onboarding.v1.OnboardingPlanQueryService. */
class ForwardChannelNameOnboardingPlanQuery implements ForwardChannelNameSink {
  private readonly client: onboardingOnboardingPlanQueryServiceApi.OnboardingPlanQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new onboardingOnboardingPlanQueryServiceApi.OnboardingPlanQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ForwardChannelNameRecord): Promise<void> {
    await call<onboardingOnboardingPlanQueryServiceApi.SummarizeOnboardingPlansRequest, onboardingOnboardingPlanQueryServiceApi.SummarizeOnboardingPlansResponse>(
      (request, done) => this.client.summarizeOnboardingPlans(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      onboardingOnboardingPlanQueryServiceApi.SummarizeOnboardingPlansRequest.fromPartial({ details: { format: record.name }, onboardingPlanId: record.status }));
  }
}

/** Runs the action registered for kind. */
async function actOnForwardChannelName(kind: string, record: ForwardChannelNameRecord, runtime: Runtime): Promise<void> {
  const actions: Record<string, () => Promise<void>> = {
    "ticket-calculation": () => new ForwardChannelNameTicketCalculation(runtime).deliver(record),
    "fan-session": () => new ForwardChannelNameFanSession(runtime).deliver(record),
    "onboarding-plan-query": () => new ForwardChannelNameOnboardingPlanQuery(runtime).deliver(record),
  };
  const action = actions[kind];
  if (!action) throw new Error(`no action for ${kind}`);
  await action();
}

/**
 * Reads acme.messaging.v1.ChannelLifecycleService/ExpireChannel and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardChannelName(runtime: Runtime): Promise<void> {
  const reader = new messagingChannelLifecycleServiceApi.ChannelLifecycleServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<messagingChannelLifecycleServiceApi.ExpireChannelRequest, messagingChannelLifecycleServiceApi.ExpireChannelResponse>(
    (request, done) => reader.expireChannel(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    messagingChannelLifecycleServiceApi.ExpireChannelRequest.fromPartial({ channelId: "main-forward-channel-name" }));
  const record: ForwardChannelNameRecord = {
    name: current.channel?.name ?? "",
    message: current.result?.message ?? "",
    status: current.outcome?.status ?? "",
    resultStatus: text.normalize(current.result?.status ?? ""),
  };
  await actOnForwardChannelName("onboarding-plan-query", record, runtime);
}
