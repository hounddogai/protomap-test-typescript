import * as chatHandoffCalculationServiceApi from "../../../.cache/proto/acme/chat/v1/handoff_calculation_service.js";
import * as experimentsExperimentApprovalServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_approval_service.js";
import * as experimentsVariantReportingServiceApi from "../../../.cache/proto/acme/experiments/v1/variant_reporting_service.js";
import * as messagingChannelValidationServiceApi from "../../../.cache/proto/acme/messaging/v1/channel_validation_service.js";
import * as surveysSurveyServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorChannelId keeps of each PreviewChannel response. */
interface MirrorChannelIdRecord {
  channelId: string;
  message: string;
  correlationId: string;
  referenceId: string;
}

/** Where mirrorChannelId hands each record. */
interface MirrorChannelIdDestination {
  forward(record: MirrorChannelIdRecord): Promise<void>;
}

/** Passes records to acme.experiments.v1.VariantReportingService. */
class MirrorChannelIdVariantReporting implements MirrorChannelIdDestination {
  private readonly client: experimentsVariantReportingServiceApi.VariantReportingServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsVariantReportingServiceApi.VariantReportingServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorChannelIdRecord): Promise<void> {
    await retry(() => call<experimentsVariantReportingServiceApi.DeleteVariantReportRequest, experimentsVariantReportingServiceApi.DeleteVariantReportResponse>(
      (request, done) => this.client.deleteVariantReport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      experimentsVariantReportingServiceApi.DeleteVariantReportRequest.fromPartial({ variantId: record.channelId, etag: record.message, reason: record.referenceId })));
  }
}

/** Writes records to acme.experiments.v1.ExperimentApprovalService. */
class MirrorChannelIdExperimentApproval implements MirrorChannelIdDestination {
  private readonly client: experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new experimentsExperimentApprovalServiceApi.ExperimentApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorChannelIdRecord): Promise<void> {
    await call<experimentsExperimentApprovalServiceApi.SubmitExperimentRequest, experimentsExperimentApprovalServiceApi.SubmitExperimentResponse>(
      (request, done) => this.client.submitExperiment(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      experimentsExperimentApprovalServiceApi.SubmitExperimentRequest.fromPartial({ experiment: { experimentId: record.channelId } }));
  }
}

/** Passes records to acme.surveys.v1.SurveyService. */
class MirrorChannelIdSurvey implements MirrorChannelIdDestination {
  private readonly client: surveysSurveyServiceApi.SurveyServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyServiceApi.SurveyServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorChannelIdRecord): Promise<void> {
    await retry(() => call<surveysSurveyServiceApi.DeleteSurveyRequest, surveysSurveyServiceApi.DeleteSurveyResponse>(
      (request, done) => this.client.deleteSurvey(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysSurveyServiceApi.DeleteSurveyRequest.fromPartial({ reason: record.message })));
  }
}

/** Sends records to acme.chat.v1.HandoffCalculationService. */
class MirrorChannelIdHandoffCalculation implements MirrorChannelIdDestination {
  private readonly client: chatHandoffCalculationServiceApi.HandoffCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatHandoffCalculationServiceApi.HandoffCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: MirrorChannelIdRecord): Promise<void> {
    await retry(() => call<chatHandoffCalculationServiceApi.EstimateHandoffRequest, chatHandoffCalculationServiceApi.EstimateHandoffResponse>(
      (request, done) => this.client.estimateHandoff(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatHandoffCalculationServiceApi.EstimateHandoffRequest.fromPartial({ handoff: { subject: record.channelId } })));
  }
}

/**
 * Reads acme.messaging.v1.ChannelValidationService/PreviewChannel and hands what it keeps to the sink of its
 * kind.
 */
export async function mirrorChannelId(runtime: Runtime): Promise<void> {
  const origin = new messagingChannelValidationServiceApi.ChannelValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await retry(() => call<messagingChannelValidationServiceApi.PreviewChannelRequest, messagingChannelValidationServiceApi.PreviewChannelResponse>(
    (request, done) => origin.previewChannel(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    messagingChannelValidationServiceApi.PreviewChannelRequest.fromPartial({ channelId: "current-mirror-channel-id" })));
  const row: MirrorChannelIdRecord = {
    channelId: current.channel?.channelId ?? "",
    message: text.normalize(current.result?.message ?? ""),
    correlationId: current.result?.correlationId ?? "",
    referenceId: current.outcome?.referenceId ?? "",
  };
  const sinks = new Map<string, MirrorChannelIdDestination>([
    ["variant-reporting", new MirrorChannelIdVariantReporting(runtime)],
    ["experiment-approval", new MirrorChannelIdExperimentApproval(runtime)],
    ["survey", new MirrorChannelIdSurvey(runtime)],
    ["handoff-calculation", new MirrorChannelIdHandoffCalculation(runtime)],
  ]);
  const sink = sinks.get(process.env["MIRROR_CHANNEL_ID_TARGET"] ?? "");
  if (!sink) return;
  await sink.forward(row);
}
