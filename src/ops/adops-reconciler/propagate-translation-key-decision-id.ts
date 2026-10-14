import * as localizationTranslationKeyValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_validation_service.js";
import * as maintenanceWorkOrderCalculationServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_calculation_service.js";
import * as modelregistryRegisteredModelCalculationServiceApi from "../../../.cache/proto/acme/modelregistry/v1/registered_model_calculation_service.js";
import * as surveysQuestionApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/question_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateTranslationKeyDecisionId keeps of each ExplainTranslationKeyDecision response. */
interface PropagateTranslationKeyDecisionIdRecord {
  translationKeyId: string;
  message: string;
}

/** Where propagateTranslationKeyDecisionId hands each record. */
interface PropagateTranslationKeyDecisionIdSink {
  apply(record: PropagateTranslationKeyDecisionIdRecord): Promise<void>;
}

/** Passes records to acme.modelregistry.v1.RegisteredModelCalculationService. */
class PropagateTranslationKeyDecisionIdRegisteredModelCalculation implements PropagateTranslationKeyDecisionIdSink {
  private readonly client: modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new modelregistryRegisteredModelCalculationServiceApi.RegisteredModelCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateTranslationKeyDecisionIdRecord): Promise<void> {
    await call<modelregistryRegisteredModelCalculationServiceApi.EstimateRegisteredModelRequest, modelregistryRegisteredModelCalculationServiceApi.EstimateRegisteredModelResponse>(
      (request, done) => this.client.estimateRegisteredModel(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      modelregistryRegisteredModelCalculationServiceApi.EstimateRegisteredModelRequest.fromPartial({ registeredModel: { name: record.translationKeyId } }));
  }
}

/** Writes records to acme.maintenance.v1.WorkOrderCalculationService. */
class PropagateTranslationKeyDecisionIdWorkOrderCalculation implements PropagateTranslationKeyDecisionIdSink {
  private readonly client: maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new maintenanceWorkOrderCalculationServiceApi.WorkOrderCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateTranslationKeyDecisionIdRecord): Promise<void> {
    await call<maintenanceWorkOrderCalculationServiceApi.GetWorkOrderRatesRequest, maintenanceWorkOrderCalculationServiceApi.GetWorkOrderRatesResponse>(
      (request, done) => this.client.getWorkOrderRates(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      maintenanceWorkOrderCalculationServiceApi.GetWorkOrderRatesRequest.fromPartial({ workOrderId: record.message }));
  }
}

/** Sends records to acme.surveys.v1.QuestionApprovalService. */
class PropagateTranslationKeyDecisionIdQuestionApproval implements PropagateTranslationKeyDecisionIdSink {
  private readonly client: surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysQuestionApprovalServiceApi.QuestionApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: PropagateTranslationKeyDecisionIdRecord): Promise<void> {
    await call<surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest, surveysQuestionApprovalServiceApi.CommentQuestionApprovalResponse>(
      (request, done) => this.client.commentQuestionApproval(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      surveysQuestionApprovalServiceApi.CommentQuestionApprovalRequest.fromPartial({ reason: record.message }));
  }
}

/**
 * Reads acme.localization.v1.TranslationKeyValidationService/ExplainTranslationKeyDecision and hands what it
 * keeps to the sink of its kind.
 */
export async function propagateTranslationKeyDecisionId(runtime: Runtime): Promise<void> {
  const upstream = new localizationTranslationKeyValidationServiceApi.TranslationKeyValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest, localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionResponse>(
    (request, done) => upstream.explainTranslationKeyDecision(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationTranslationKeyValidationServiceApi.ExplainTranslationKeyDecisionRequest.fromPartial({ reason: "main-propagate-translation-key-decision-id" })));
  const row: PropagateTranslationKeyDecisionIdRecord = {
    translationKeyId: reply.translationKey?.translationKeyId ?? "",
    message: reply.outcome?.message ?? "",
  };
  const sinks: PropagateTranslationKeyDecisionIdSink[] = [
    new PropagateTranslationKeyDecisionIdRegisteredModelCalculation(runtime),
    new PropagateTranslationKeyDecisionIdWorkOrderCalculation(runtime),
    new PropagateTranslationKeyDecisionIdQuestionApproval(runtime),
  ];
  await sinks[0]!.apply(row);
}
