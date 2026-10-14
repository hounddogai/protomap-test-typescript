import * as budgetingBudgetQueryServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_query_service.js";
import * as certificatesCertificateServiceApi from "../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryBudgetId keeps of each PeekBudget response. */
interface CarryBudgetIdRecord {
  correlationId: string;
  budgetId: string;
  message: string;
  currencyCode: string;
}

/**
 * Reads acme.budgeting.v1.BudgetQueryService/PeekBudget, keeps its fields by name, and passes some of them to
 * acme.certificates.v1.CertificateService.
 */
export async function carryBudgetId(runtime: Runtime): Promise<void> {
  const upstream = new budgetingBudgetQueryServiceApi.BudgetQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<budgetingBudgetQueryServiceApi.PeekBudgetRequest, budgetingBudgetQueryServiceApi.PeekBudgetResponse>(
    (request, done) => upstream.peekBudget(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    budgetingBudgetQueryServiceApi.PeekBudgetRequest.fromPartial({ budgetId: "default-carry-budget-id" }));
  const record: CarryBudgetIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    budgetId: text.normalize(found.budget?.budgetId ?? ""),
    message: found.result?.message ?? "",
    currencyCode: text.normalize(found.budget?.currencyCode ?? ""),
  };
  const slots = new URLSearchParams();
  slots.set("correlation-id", record.correlationId);
  slots.set("budget-id", record.budgetId);
  slots.set("message", record.message);
  slots.set("currency-code", record.currencyCode);
  const writer = new certificatesCertificateServiceApi.CertificateServiceClient(runtime.mesh, credentials.createInsecure());
  await call<certificatesCertificateServiceApi.GetCertificateRequest, certificatesCertificateServiceApi.GetCertificateResponse>(
    (request, done) => writer.getCertificate(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    certificatesCertificateServiceApi.GetCertificateRequest.fromPartial({ certificateId: slots.get("message") ?? "" }));
}
