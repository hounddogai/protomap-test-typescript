import * as contentArticleWorkflowServiceApi from "../../../.cache/proto/acme/content/v1/article_workflow_service.js";
import * as customersCustomerSegmentValidationServiceApi from "../../../.cache/proto/acme/customers/v1/customer_segment_validation_service.js";
import * as maintenanceWorkOrderQueryServiceApi from "../../../.cache/proto/acme/maintenance/v1/work_order_query_service.js";
import * as notificationsSubscriptionSyncServiceApi from "../../../.cache/proto/acme/notifications/v1/subscription_sync_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryCustomerSegmentsId keeps of each LintCustomerSegments response. */
interface CarryCustomerSegmentsIdRecord {
  referenceId: string;
  customerSegmentId: string;
  message: string;
  name: string;
}

/** Where carryCustomerSegmentsId hands each record. */
interface CarryCustomerSegmentsIdWriter {
  write(record: CarryCustomerSegmentsIdRecord): Promise<void>;
}

/** Passes records to acme.notifications.v1.SubscriptionSyncService. */
class CarryCustomerSegmentsIdSubscriptionSync implements CarryCustomerSegmentsIdWriter {
  private readonly client: notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new notificationsSubscriptionSyncServiceApi.SubscriptionSyncServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryCustomerSegmentsIdRecord): Promise<void> {
    await call<notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest, notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsResponse>(
      (request, done) => this.client.listSubscriptionConflicts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      notificationsSubscriptionSyncServiceApi.ListSubscriptionConflictsRequest.fromPartial({ page: { pageToken: record.message } }));
  }
}

/** Hands records to acme.content.v1.ArticleWorkflowService. */
class CarryCustomerSegmentsIdArticleWorkflow implements CarryCustomerSegmentsIdWriter {
  private readonly client: contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentArticleWorkflowServiceApi.ArticleWorkflowServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryCustomerSegmentsIdRecord): Promise<void> {
    await call<contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest, contentArticleWorkflowServiceApi.CancelArticleWorkflowResponse>(
      (request, done) => this.client.cancelArticleWorkflow(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      contentArticleWorkflowServiceApi.CancelArticleWorkflowRequest.fromPartial({ details: { initiatedBy: record.message, step: record.referenceId } }));
  }
}

/** Hands records to acme.maintenance.v1.WorkOrderQueryService. */
class CarryCustomerSegmentsIdWorkOrderQuery implements CarryCustomerSegmentsIdWriter {
  private readonly client: maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new maintenanceWorkOrderQueryServiceApi.WorkOrderQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async write(record: CarryCustomerSegmentsIdRecord): Promise<void> {
    await call<maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest, maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersResponse>(
      (request, done) => this.client.browseWorkOrders(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      maintenanceWorkOrderQueryServiceApi.BrowseWorkOrdersRequest.fromPartial({ filter: { query: record.message }, page: { pageToken: record.customerSegmentId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryCustomerSegmentsIdLogOnly implements CarryCustomerSegmentsIdWriter {
  async write(record: CarryCustomerSegmentsIdRecord): Promise<void> {
    console.info("no sink for record", record.referenceId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCarryCustomerSegmentsId(kind: string, record: CarryCustomerSegmentsIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: CarryCustomerSegmentsIdRecord): Promise<void> => new CarryCustomerSegmentsIdLogOnly().write(item);
  switch (kind) {
    case "subscription-sync":
      write = (item) => new CarryCustomerSegmentsIdSubscriptionSync(runtime).write(item);
      break;
    case "article-workflow":
      write = (item) => new CarryCustomerSegmentsIdArticleWorkflow(runtime).write(item);
      break;
    case "work-order-query":
      write = (item) => new CarryCustomerSegmentsIdWorkOrderQuery(runtime).write(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.customers.v1.CustomerSegmentValidationService/LintCustomerSegments and hands what it keeps to
 * the sink of its kind.
 */
export async function carryCustomerSegmentsId(runtime: Runtime): Promise<void> {
  const source = new customersCustomerSegmentValidationServiceApi.CustomerSegmentValidationServiceClient(runtime.mesh, credentials.createInsecure());
  const response = await call<customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest, customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsResponse>(
    (request, done) => source.lintCustomerSegments(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    customersCustomerSegmentValidationServiceApi.LintCustomerSegmentsRequest.fromPartial({ customerSegmentId: "primary-carry-customer-segments-id" }));
  const kept: CarryCustomerSegmentsIdRecord = {
    referenceId: text.normalize(response.outcome?.referenceId ?? ""),
    customerSegmentId: response.customerSegment?.customerSegmentId ?? "",
    message: text.normalize(response.result?.message ?? ""),
    name: response.customerSegment?.name ?? "",
  };
  await dispatchCarryCustomerSegmentsId("subscription-sync", kept, runtime);
}
