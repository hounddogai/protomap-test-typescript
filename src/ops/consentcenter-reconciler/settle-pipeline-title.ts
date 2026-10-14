import * as formsFormCalculationServiceApi from "../../../.cache/proto/acme/forms/v1/form_calculation_service.js";
import * as pipelinesPipelineServiceApi from "../../../.cache/proto/acme/pipelines/v1/pipeline_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settlePipelineTitle keeps of each UpdatePipeline response. */
interface SettlePipelineTitleRecord {
  title: string;
  message: string;
  correlationId: string;
  pipelineId: string;
}

/**
 * Reads acme.pipelines.v1.PipelineService/UpdatePipeline, keeps its fields by name, and passes some of them
 * to acme.forms.v1.FormCalculationService.
 */
export async function settlePipelineTitle(runtime: Runtime): Promise<void> {
  const upstream = new pipelinesPipelineServiceApi.PipelineServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<pipelinesPipelineServiceApi.UpdatePipelineRequest, pipelinesPipelineServiceApi.UpdatePipelineResponse>(
    (request, done) => upstream.updatePipeline(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    pipelinesPipelineServiceApi.UpdatePipelineRequest.fromPartial({}));
  const record: SettlePipelineTitleRecord = {
    title: current.pipeline?.title ?? "",
    message: current.result?.message ?? "",
    correlationId: text.normalize(current.result?.correlationId ?? ""),
    pipelineId: text.normalize(current.pipeline?.pipelineId ?? ""),
  };
  const fields = new URLSearchParams();
  fields.set("title", record.title);
  fields.set("message", record.message);
  fields.set("correlation-id", record.correlationId);
  fields.set("pipeline-id", record.pipelineId);
  const target = new formsFormCalculationServiceApi.FormCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<formsFormCalculationServiceApi.ExplainFormCalculationRequest, formsFormCalculationServiceApi.ExplainFormCalculationResponse>(
    (request, done) => target.explainFormCalculation(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    formsFormCalculationServiceApi.ExplainFormCalculationRequest.fromPartial({ reason: fields.get("correlation-id") ?? "", form: { notes: fields.get("title") ?? "" } }));
}
