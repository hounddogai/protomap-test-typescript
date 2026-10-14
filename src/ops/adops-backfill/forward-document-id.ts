import * as documentsDocumentServiceApi from "../../../.cache/proto/acme/documents/v1/document_service.js";
import * as experimentsExperimentCalculationServiceApi from "../../../.cache/proto/acme/experiments/v1/experiment_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardDocumentId keeps of each GetDocument response. */
interface ForwardDocumentIdRecord {
  correlationId: string;
  status: string;
  number: string;
  message: string;
}

/**
 * Reads acme.documents.v1.DocumentService/GetDocument, keeps its fields by name, and passes some of them to
 * acme.experiments.v1.ExperimentCalculationService.
 */
export async function forwardDocumentId(runtime: Runtime): Promise<void> {
  const reader = new documentsDocumentServiceApi.DocumentServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<documentsDocumentServiceApi.GetDocumentRequest, documentsDocumentServiceApi.GetDocumentResponse>(
    (request, done) => reader.getDocument(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    documentsDocumentServiceApi.GetDocumentRequest.fromPartial({ documentId: "current-forward-document-id" }));
  const entry: ForwardDocumentIdRecord = {
    correlationId: response.result?.correlationId ?? "",
    status: response.result?.status ?? "",
    number: response.document?.number ?? "",
    message: response.result?.message ?? "",
  };
  const params = new Headers();
  params.set("x-correlation-id", entry.correlationId);
  params.set("x-status", entry.status);
  params.set("x-number", entry.number);
  params.set("x-message", entry.message);
  const downstream = new experimentsExperimentCalculationServiceApi.ExperimentCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  await retry(() => call<experimentsExperimentCalculationServiceApi.QuoteExperimentRequest, experimentsExperimentCalculationServiceApi.QuoteExperimentResponse>(
    (request, done) => downstream.quoteExperiment(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    experimentsExperimentCalculationServiceApi.QuoteExperimentRequest.fromPartial({ details: { currencyCode: params.get("x-status") ?? "" }, reason: params.get("x-message") ?? "" })));
}
