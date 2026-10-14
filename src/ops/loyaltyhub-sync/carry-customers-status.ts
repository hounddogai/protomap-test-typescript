import * as customersCustomerQueryServiceApi from "../../../.cache/proto/acme/customers/v1/customer_query_service.js";
import * as mediaTranscodeJobApprovalServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_approval_service.js";
import * as sellersSellerQueryServiceApi from "../../../.cache/proto/acme/sellers/v1/seller_query_service.js";
import * as ticketingTicketServiceApi from "../../../.cache/proto/acme/ticketing/v1/ticket_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryCustomersStatus keeps of each FindCustomers response. */
interface CarryCustomersStatusRecord {
  status: string;
  nextPageToken: string;
}

/** Where carryCustomersStatus hands each record. */
interface CarryCustomersStatusWriter {
  forward(record: CarryCustomersStatusRecord): Promise<void>;
}

/** Writes records to acme.ticketing.v1.TicketService. */
class CarryCustomersStatusTicket implements CarryCustomersStatusWriter {
  private readonly client: ticketingTicketServiceApi.TicketServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new ticketingTicketServiceApi.TicketServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCustomersStatusRecord): Promise<void> {
    await call<ticketingTicketServiceApi.DeleteTicketRequest, ticketingTicketServiceApi.DeleteTicketResponse>(
      (request, done) => this.client.deleteTicket(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      ticketingTicketServiceApi.DeleteTicketRequest.fromPartial({ reason: record.nextPageToken }));
  }
}

/** Hands records to acme.media.v1.TranscodeJobApprovalService. */
class CarryCustomersStatusTranscodeJobApproval implements CarryCustomersStatusWriter {
  private readonly client: mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobApprovalServiceApi.TranscodeJobApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCustomersStatusRecord): Promise<void> {
    await call<mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest, mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobResponse>(
      (request, done) => this.client.escalateTranscodeJob(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaTranscodeJobApprovalServiceApi.EscalateTranscodeJobRequest.fromPartial({ reason: record.status }));
  }
}

/** Sends records to acme.sellers.v1.SellerQueryService. */
class CarryCustomersStatusSellerQuery implements CarryCustomersStatusWriter {
  private readonly client: sellersSellerQueryServiceApi.SellerQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new sellersSellerQueryServiceApi.SellerQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CarryCustomersStatusRecord): Promise<void> {
    await call<sellersSellerQueryServiceApi.LookupSellerRequest, sellersSellerQueryServiceApi.LookupSellerResponse>(
      (request, done) => this.client.lookupSeller(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      sellersSellerQueryServiceApi.LookupSellerRequest.fromPartial({ sellerId: record.nextPageToken }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryCustomersStatusLogOnly implements CarryCustomersStatusWriter {
  async forward(record: CarryCustomersStatusRecord): Promise<void> {
    console.info("no sink for record", record.status);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCarryCustomersStatus(kind: string, record: CarryCustomersStatusRecord, runtime: Runtime): Promise<void> {
  let write = (item: CarryCustomersStatusRecord): Promise<void> => new CarryCustomersStatusLogOnly().forward(item);
  switch (kind) {
    case "ticket":
      write = (item) => new CarryCustomersStatusTicket(runtime).forward(item);
      break;
    case "transcode-job-approval":
      write = (item) => new CarryCustomersStatusTranscodeJobApproval(runtime).forward(item);
      break;
    case "seller-query":
      write = (item) => new CarryCustomersStatusSellerQuery(runtime).forward(item);
      break;
  }
  await write(record);
}

/** Reads acme.customers.v1.CustomerQueryService/FindCustomers and hands what it keeps to the sink of its kind. */
export async function carryCustomersStatus(runtime: Runtime): Promise<void> {
  const source = new customersCustomerQueryServiceApi.CustomerQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await retry(() => call<customersCustomerQueryServiceApi.FindCustomersRequest, customersCustomerQueryServiceApi.FindCustomersResponse>(
    (request, done) => source.findCustomers(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    customersCustomerQueryServiceApi.FindCustomersRequest.fromPartial({ orderBy: "primary-carry-customers-status" })));
  const entry: CarryCustomersStatusRecord = {
    status: found.result?.status ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  await dispatchCarryCustomersStatus("transcode-job-approval", entry, runtime);
}
