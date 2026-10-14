import * as audiencesAudienceMemberApprovalServiceApi from "../../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as budgetingBudgetServiceApi from "../../../.cache/proto/acme/budgeting/v1/budget_service.js";
import * as procurementPurchaseRequisitionServiceApi from "../../../.cache/proto/acme/procurement/v1/purchase_requisition_service.js";
import * as searchSearchIndexServiceApi from "../../../.cache/proto/acme/search/v1/search_index_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What propagateBudgetMessage keeps of each DeleteBudget response. */
interface PropagateBudgetMessageRecord {
  message: string;
  correlationId: string;
  status: string;
}

/** Where propagateBudgetMessage hands each record. */
interface PropagateBudgetMessageSink {
  write(record: PropagateBudgetMessageRecord): Promise<void>;
}

/** Passes records to acme.search.v1.SearchIndexService. */
class PropagateBudgetMessageSearchIndex implements PropagateBudgetMessageSink {
  private readonly client: searchSearchIndexServiceApi.SearchIndexServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new searchSearchIndexServiceApi.SearchIndexServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateBudgetMessageRecord): Promise<void> {
    await call<searchSearchIndexServiceApi.SearchSearchIndexesRequest, searchSearchIndexServiceApi.SearchSearchIndexesResponse>(
      (request, done) => this.client.searchSearchIndexes(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      searchSearchIndexServiceApi.SearchSearchIndexesRequest.fromPartial({ filter: { region: record.status } }));
  }
}

/** Sends records to acme.audiences.v1.AudienceMemberApprovalService. */
class PropagateBudgetMessageAudienceMemberApproval implements PropagateBudgetMessageSink {
  private readonly client: audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateBudgetMessageRecord): Promise<void> {
    await call<audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest, audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberResponse>(
      (request, done) => this.client.escalateAudienceMember(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      audiencesAudienceMemberApprovalServiceApi.EscalateAudienceMemberRequest.fromPartial({ details: { comment: record.message }, audienceMember: { audienceMemberId: record.status } }));
  }
}

/** Hands records to acme.procurement.v1.PurchaseRequisitionService. */
class PropagateBudgetMessagePurchaseRequisition implements PropagateBudgetMessageSink {
  private readonly client: procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new procurementPurchaseRequisitionServiceApi.PurchaseRequisitionServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: PropagateBudgetMessageRecord): Promise<void> {
    await call<procurementPurchaseRequisitionServiceApi.UpdatePurchaseRequisitionRequest, procurementPurchaseRequisitionServiceApi.UpdatePurchaseRequisitionResponse>(
      (request, done) => this.client.updatePurchaseRequisition(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      procurementPurchaseRequisitionServiceApi.UpdatePurchaseRequisitionRequest.fromPartial({ purchaseRequisition: { purchaseRequisitionId: record.status } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class PropagateBudgetMessageLogOnly implements PropagateBudgetMessageSink {
  async write(record: PropagateBudgetMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverPropagateBudgetMessage(kind: string, record: PropagateBudgetMessageRecord, runtime: Runtime): Promise<void> {
  let sink: PropagateBudgetMessageSink = new PropagateBudgetMessageLogOnly();
  switch (kind) {
    case "search-index":
      sink = new PropagateBudgetMessageSearchIndex(runtime);
      break;
    case "audience-member-approval":
      sink = new PropagateBudgetMessageAudienceMemberApproval(runtime);
      break;
    case "purchase-requisition":
      sink = new PropagateBudgetMessagePurchaseRequisition(runtime);
      break;
  }
  await sink.write(record);
}

/** Reads acme.budgeting.v1.BudgetService/DeleteBudget and hands what it keeps to the sink of its kind. */
export async function propagateBudgetMessage(runtime: Runtime): Promise<void> {
  const upstream = new budgetingBudgetServiceApi.BudgetServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<budgetingBudgetServiceApi.DeleteBudgetRequest, budgetingBudgetServiceApi.DeleteBudgetResponse>(
    (request, done) => upstream.deleteBudget(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    budgetingBudgetServiceApi.DeleteBudgetRequest.fromPartial({ budgetId: "main-propagate-budget-message" }));
  const record: PropagateBudgetMessageRecord = {
    message: current.result?.message ?? "",
    correlationId: current.result?.correlationId ?? "",
    status: text.normalize(current.result?.status ?? ""),
  };
  await deliverPropagateBudgetMessage("audience-member-approval", record, runtime);
}
