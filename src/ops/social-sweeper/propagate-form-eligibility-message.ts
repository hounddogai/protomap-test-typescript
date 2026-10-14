import * as formsFormValidationServiceApi from "../../../.cache/proto/acme/forms/v1/form_validation_service.js";
import * as notificationsDeliveryAttemptValidationServiceApi from "../../../.cache/proto/acme/notifications/v1/delivery_attempt_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateFormEligibilityMessage keeps of each CheckFormEligibility response. */
interface PropagateFormEligibilityMessageRecord {
  message: string;
  number: string;
  status: string;
}

/**
 * Reads acme.forms.v1.FormValidationService/CheckFormEligibility, keeps its fields by name, and passes some
 * of them to acme.notifications.v1.DeliveryAttemptValidationService.
 */
export async function propagateFormEligibilityMessage(runtime: Runtime): Promise<void> {
  const reader = new formsFormValidationServiceApi.FormValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<formsFormValidationServiceApi.CheckFormEligibilityRequest, formsFormValidationServiceApi.CheckFormEligibilityResponse>(
    (request, done) => reader.checkFormEligibility(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    formsFormValidationServiceApi.CheckFormEligibilityRequest.fromPartial({ formId: "primary-propagate-form-eligibility-message" }));
  const record: PropagateFormEligibilityMessageRecord = {
    message: text.normalize(found.result?.message ?? ""),
    number: found.form?.number ?? "",
    status: text.normalize(found.outcome?.status ?? ""),
  };
  const slots = new URLSearchParams();
  slots.set("message", record.message);
  slots.set("number", record.number);
  slots.set("status", record.status);
  const downstream = new notificationsDeliveryAttemptValidationServiceApi.DeliveryAttemptValidationServiceClient(runtime.mesh, credentials.createInsecure());
  await call<notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest, notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionResponse>(
    (request, done) => downstream.explainDeliveryAttemptDecision(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    notificationsDeliveryAttemptValidationServiceApi.ExplainDeliveryAttemptDecisionRequest.fromPartial({ deliveryAttempt: { source: slots.get("message") ?? "" } }));
}
