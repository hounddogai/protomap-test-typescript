import * as localizationTranslationJobValidationServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_validation_service.js";
import * as ticketingTicketServiceApi from "../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateTranslationJobDecisionMessage keeps of each ExplainTranslationJobDecision response. */
interface PropagateTranslationJobDecisionMessageRecord {
  message: string;
  referenceId: string;
  translationJobId: string;
  subject: string;
}

/**
 * Reads acme.localization.v1.TranslationJobValidationService/ExplainTranslationJobDecision, keeps its fields
 * by name, and passes some of them to acme.ticketing.v1.TicketService.
 */
export async function propagateTranslationJobDecisionMessage(runtime: Runtime): Promise<void> {
  const source = new localizationTranslationJobValidationServiceApi.TranslationJobValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest, localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionResponse>(
    (request, done) => source.explainTranslationJobDecision(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    localizationTranslationJobValidationServiceApi.ExplainTranslationJobDecisionRequest.fromPartial({ translationJobId: "current-propagate-translation-job-decision-message" }));
  const row: PropagateTranslationJobDecisionMessageRecord = {
    message: current.outcome?.message ?? "",
    referenceId: text.normalize(current.outcome?.referenceId ?? ""),
    translationJobId: current.translationJob?.translationJobId ?? "",
    subject: text.normalize(current.translationJob?.subject ?? ""),
  };
  const fields = new URLSearchParams();
  fields.set("message", row.message);
  fields.set("reference-id", row.referenceId);
  fields.set("translation-job-id", row.translationJobId);
  fields.set("subject", row.subject);
  const writer = new ticketingTicketServiceApi.TicketServiceClient(runtime.mesh, credentials.createInsecure());
  await call<ticketingTicketServiceApi.CloneTicketRequest, ticketingTicketServiceApi.CloneTicketResponse>(
    (request, done) => writer.cloneTicket(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    ticketingTicketServiceApi.CloneTicketRequest.fromPartial({ requestId: fields.get("translation-job-id") ?? "", ticket: { ticketId: fields.get("message") ?? "" } }));
}
