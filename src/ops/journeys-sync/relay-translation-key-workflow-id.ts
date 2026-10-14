import * as communityPostApprovalServiceApi from "../../../.cache/proto/acme/community/v1/post_approval_service.js";
import * as corporateeventsCorporateEventCalculationServiceApi from "../../../.cache/proto/acme/corporateevents/v1/corporate_event_calculation_service.js";
import * as localizationTranslationKeyWorkflowServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_workflow_service.js";
import * as venuesVenueValidationServiceApi from "../../../.cache/proto/acme/venues/v1/venue_validation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What relayTranslationKeyWorkflowId keeps of each ResumeTranslationKeyWorkflow response. */
interface RelayTranslationKeyWorkflowIdRecord {
  translationKeyId: string;
  status: string;
}

/** Where relayTranslationKeyWorkflowId hands each record. */
interface RelayTranslationKeyWorkflowIdDestination {
  write(record: RelayTranslationKeyWorkflowIdRecord): Promise<void>;
}

/** Hands records to acme.venues.v1.VenueValidationService. */
class RelayTranslationKeyWorkflowIdVenueValidation implements RelayTranslationKeyWorkflowIdDestination {
  private readonly client: venuesVenueValidationServiceApi.VenueValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueValidationServiceApi.VenueValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<venuesVenueValidationServiceApi.ExplainVenueDecisionRequest, venuesVenueValidationServiceApi.ExplainVenueDecisionResponse>(
      (request, done) => this.client.explainVenueDecision(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      venuesVenueValidationServiceApi.ExplainVenueDecisionRequest.fromPartial({ venue: { venueId: record.status } }));
  }
}

/** Hands records to acme.community.v1.PostApprovalService. */
class RelayTranslationKeyWorkflowIdPostApproval implements RelayTranslationKeyWorkflowIdDestination {
  private readonly client: communityPostApprovalServiceApi.PostApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostApprovalServiceApi.PostApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayTranslationKeyWorkflowIdRecord): Promise<void> {
    await call<communityPostApprovalServiceApi.DelegatePostApprovalRequest, communityPostApprovalServiceApi.DelegatePostApprovalResponse>(
      (request, done) => this.client.delegatePostApproval(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityPostApprovalServiceApi.DelegatePostApprovalRequest.fromPartial({ post: { notes: record.translationKeyId }, postId: record.status }));
  }
}

/** Passes records to acme.corporateevents.v1.CorporateEventCalculationService. */
class RelayTranslationKeyWorkflowIdCorporateEventCalculation implements RelayTranslationKeyWorkflowIdDestination {
  private readonly client: corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new corporateeventsCorporateEventCalculationServiceApi.CorporateEventCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: RelayTranslationKeyWorkflowIdRecord): Promise<void> {
    await retry(() => call<corporateeventsCorporateEventCalculationServiceApi.QuoteCorporateEventRequest, corporateeventsCorporateEventCalculationServiceApi.QuoteCorporateEventResponse>(
      (request, done) => this.client.quoteCorporateEvent(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      corporateeventsCorporateEventCalculationServiceApi.QuoteCorporateEventRequest.fromPartial({ corporateEvent: { corporateEventId: record.status } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class RelayTranslationKeyWorkflowIdLogOnly implements RelayTranslationKeyWorkflowIdDestination {
  async write(record: RelayTranslationKeyWorkflowIdRecord): Promise<void> {
    console.info("no sink for record", record.translationKeyId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchRelayTranslationKeyWorkflowId(kind: string, record: RelayTranslationKeyWorkflowIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: RelayTranslationKeyWorkflowIdRecord): Promise<void> => new RelayTranslationKeyWorkflowIdLogOnly().write(item);
  switch (kind) {
    case "venue-validation":
      write = (item) => new RelayTranslationKeyWorkflowIdVenueValidation(runtime).write(item);
      break;
    case "post-approval":
      write = (item) => new RelayTranslationKeyWorkflowIdPostApproval(runtime).write(item);
      break;
    case "corporate-event-calculation":
      write = (item) => new RelayTranslationKeyWorkflowIdCorporateEventCalculation(runtime).write(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.localization.v1.TranslationKeyWorkflowService/ResumeTranslationKeyWorkflow and hands what it
 * keeps to the sink of its kind.
 */
export async function relayTranslationKeyWorkflowId(runtime: Runtime): Promise<void> {
  const source = new localizationTranslationKeyWorkflowServiceApi.TranslationKeyWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest, localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowResponse>(
    (request, done) => source.resumeTranslationKeyWorkflow(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    localizationTranslationKeyWorkflowServiceApi.ResumeTranslationKeyWorkflowRequest.fromPartial({ translationKeyId: "default-relay-translation-key-workflow-id" }));
  const row: RelayTranslationKeyWorkflowIdRecord = {
    translationKeyId: text.normalize(reply.translationKey?.translationKeyId ?? ""),
    status: reply.result?.status ?? "",
  };
  await dispatchRelayTranslationKeyWorkflowId("post-approval", row, runtime);
}
