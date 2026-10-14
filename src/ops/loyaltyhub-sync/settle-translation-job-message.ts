import * as localizationTranslationJobApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_job_approval_service.js";
import * as webbffClientSessionQueryServiceApi from "../../../.cache/proto/acme/webbff/v1/client_session_query_service.js";
import { credentials } from "@grpc/grpc-js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What settleTranslationJobMessage keeps of each RejectTranslationJob response. */
interface SettleTranslationJobMessageRecord {
  message: string;
  referenceId: string;
  resultMessage: string;
}

/**
 * Reads acme.localization.v1.TranslationJobApprovalService/RejectTranslationJob, keeps its fields by name,
 * and passes some of them to acme.webbff.v1.ClientSessionQueryService.
 */
export async function settleTranslationJobMessage(runtime: Runtime): Promise<void> {
  const upstream = new localizationTranslationJobApprovalServiceApi.TranslationJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest, localizationTranslationJobApprovalServiceApi.RejectTranslationJobResponse>(
    (request, done) => upstream.rejectTranslationJob(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationTranslationJobApprovalServiceApi.RejectTranslationJobRequest.fromPartial({ reason: "live-settle-translation-job-message" }));
  const record: SettleTranslationJobMessageRecord = {
    message: found.outcome?.message ?? "",
    referenceId: found.outcome?.referenceId ?? "",
    resultMessage: found.result?.message ?? "",
  };
  const carried = new URLSearchParams();
  carried.set("message", record.message);
  carried.set("reference-id", record.referenceId);
  carried.set("result-message", record.resultMessage);
  const writer = new webbffClientSessionQueryServiceApi.ClientSessionQueryServiceClient(runtime.mesh, credentials.createInsecure());
  await call<webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest, webbffClientSessionQueryServiceApi.SuggestClientSessionsResponse>(
    (request, done) => writer.suggestClientSessions(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    webbffClientSessionQueryServiceApi.SuggestClientSessionsRequest.fromPartial({ filter: { region: carried.get("reference-id") ?? "", ownerId: carried.get("message") ?? "" } }));
}
