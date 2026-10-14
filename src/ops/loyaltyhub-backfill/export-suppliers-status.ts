import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as messagingParticipantImportServiceApi from "../../../.cache/proto/acme/messaging/v1/participant_import_service.js";
import * as suppliersSupplierQueryServiceApi from "../../../.cache/proto/acme/suppliers/v1/supplier_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What exportSuppliersStatus keeps of each SuggestSuppliers response. */
interface ExportSuppliersStatusRecord {
  status: string;
  correlationId: string;
  nextPageToken: string;
}

/** Where exportSuppliersStatus hands each record. */
interface ExportSuppliersStatusDestination {
  apply(record: ExportSuppliersStatusRecord): Promise<void>;
}

/** Writes records to acme.messaging.v1.ParticipantImportService. */
class ExportSuppliersStatusParticipantImport implements ExportSuppliersStatusDestination {
  private readonly client: messagingParticipantImportServiceApi.ParticipantImportServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new messagingParticipantImportServiceApi.ParticipantImportServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportSuppliersStatusRecord): Promise<void> {
    await call<messagingParticipantImportServiceApi.RetryParticipantImportRequest, messagingParticipantImportServiceApi.RetryParticipantImportResponse>(
      (request, done) => this.client.retryParticipantImport(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      messagingParticipantImportServiceApi.RetryParticipantImportRequest.fromPartial({ participantId: record.correlationId, reason: record.nextPageToken, participant: { participantId: record.status } }));
  }
}

/** Sends records to acme.boxoffice.v1.BoxOfficeSaleQueryService. */
class ExportSuppliersStatusBoxOfficeSaleQuery implements ExportSuppliersStatusDestination {
  private readonly client: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async apply(record: ExportSuppliersStatusRecord): Promise<void> {
    await call<boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest, boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesResponse>(
      (request, done) => this.client.suggestBoxOfficeSales(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      boxofficeBoxOfficeSaleQueryServiceApi.SuggestBoxOfficeSalesRequest.fromPartial({ filter: { query: record.status } }));
  }
}

/**
 * Reads acme.suppliers.v1.SupplierQueryService/SuggestSuppliers and hands what it keeps to the sink of its
 * kind.
 */
export async function exportSuppliersStatus(runtime: Runtime): Promise<void> {
  const source = new suppliersSupplierQueryServiceApi.SupplierQueryServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<suppliersSupplierQueryServiceApi.SuggestSuppliersRequest, suppliersSupplierQueryServiceApi.SuggestSuppliersResponse>(
    (request, done) => source.suggestSuppliers(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    suppliersSupplierQueryServiceApi.SuggestSuppliersRequest.fromPartial({ orderBy: "primary-export-suppliers-status" }));
  const kept: ExportSuppliersStatusRecord = {
    status: text.normalize(found.result?.status ?? ""),
    correlationId: found.result?.correlationId ?? "",
    nextPageToken: found.pageInfo?.nextPageToken ?? "",
  };
  const sinks: ExportSuppliersStatusDestination[] = [
    new ExportSuppliersStatusParticipantImport(runtime),
    new ExportSuppliersStatusBoxOfficeSaleQuery(runtime),
  ];
  for (const sink of sinks) {
    await sink.apply(kept);
  }
}
