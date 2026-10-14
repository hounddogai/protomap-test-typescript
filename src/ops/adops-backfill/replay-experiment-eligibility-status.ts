import * as experimentsExperimentValidationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_validation_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import * as telehealthVideoVisitCalculationServiceApi from "../../../.cache/proto/acme/telehealth/v1/video_visit_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What replayExperimentEligibilityStatus keeps of each CheckExperimentEligibility response. */
interface ReplayExperimentEligibilityStatusRecord {
  status: string;
  experimentId: string;
  message: string;
}

/** Where replayExperimentEligibilityStatus hands each record. */
interface ReplayExperimentEligibilityStatusDestination {
  deliver(record: ReplayExperimentEligibilityStatusRecord): Promise<void>;
}

/** Writes records to acme.telehealth.v1.VideoVisitCalculationService. */
class ReplayExperimentEligibilityStatusVideoVisitCalculation implements ReplayExperimentEligibilityStatusDestination {
  private readonly client: telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new telehealthVideoVisitCalculationServiceApi.VideoVisitCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayExperimentEligibilityStatusRecord): Promise<void> {
    await call<telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest, telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitResponse>(
      (request, done) => this.client.calculateVideoVisit(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      telehealthVideoVisitCalculationServiceApi.CalculateVideoVisitRequest.fromPartial({ videoVisitId: record.status, videoVisit: { title: record.experimentId } }));
  }
}

/** Sends records to acme.surveys.v1.QuestionApprovalService. */
class ReplayExperimentEligibilityStatusQuestionApproval implements ReplayExperimentEligibilityStatusDestination {
  private readonly client: surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: ReplayExperimentEligibilityStatusRecord): Promise<void> {
    await retry(() => call<surveysQuestionApprovalServiceApi.EscalateQuestionRequest, surveysQuestionApprovalServiceApi.EscalateQuestionResponse>(
      (request, done) => this.client.escalateQuestion(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysQuestionApprovalServiceApi.EscalateQuestionRequest.fromPartial({ question: { description: record.experimentId }, details: { comment: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class ReplayExperimentEligibilityStatusLogOnly implements ReplayExperimentEligibilityStatusDestination {
  async deliver(record: ReplayExperimentEligibilityStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchReplayExperimentEligibilityStatus(kind: string, record: ReplayExperimentEligibilityStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: ReplayExperimentEligibilityStatusRecord): Promise<void> => new ReplayExperimentEligibilityStatusLogOnly().deliver(item);
  switch (kind) {
    case "video-visit-calculation":
      write = (item) => new ReplayExperimentEligibilityStatusVideoVisitCalculation(runtime).deliver(item);
      break;
    case "question-approval":
      write = (item) => new ReplayExperimentEligibilityStatusQuestionApproval(runtime).deliver(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.experiments.v1.ExperimentValidationService/CheckExperimentEligibility and hands what it keeps to
 * the sink of its kind.
 */
export async function replayExperimentEligibilityStatus(runtime: Runtime): Promise<void> {
  const source = new experimentsExperimentValidationServiceApi.ExperimentValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest, experimentsExperimentValidationServiceApi.CheckExperimentEligibilityResponse>(
    (request, done) => source.checkExperimentEligibility(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    experimentsExperimentValidationServiceApi.CheckExperimentEligibilityRequest.fromPartial({ reason: "nightly-replay-experiment-eligibility-status" })));
  const record: ReplayExperimentEligibilityStatusRecord = {
    status: text.normalize(found.result?.status ?? ""),
    experimentId: text.normalize(found.experiment?.experimentId ?? ""),
    message: found.outcome?.message ?? "",
  };
  await dispatchReplayExperimentEligibilityStatus("question-approval", record, runtime);
}
