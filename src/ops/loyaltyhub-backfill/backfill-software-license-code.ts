import * as certificatesCertificateServiceApi from "../../../.cache/proto/acme/certificates/v1/certificate_service.js";
import * as contentTaxonomyApprovalServiceApi from "../../../.cache/proto/acme/content/v1/taxonomy_approval_service.js";
import * as licensingSoftwareLicenseServiceApi from "../../../.cache/proto/acme/licensing/v1/software_license_service.js";
import * as warehousingWarehouseQueryServiceApi from "../../../.cache/proto/acme/warehousing/v1/warehouse_query_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What backfillSoftwareLicenseCode keeps of each CloneSoftwareLicense response. */
interface BackfillSoftwareLicenseCodeRecord {
  currencyCode: string;
  message: string;
  softwareLicenseId: string;
  correlationId: string;
}

/** Where backfillSoftwareLicenseCode hands each record. */
interface BackfillSoftwareLicenseCodeTarget {
  send(record: BackfillSoftwareLicenseCodeRecord): Promise<void>;
}

/** Writes records to acme.warehousing.v1.WarehouseQueryService. */
class BackfillSoftwareLicenseCodeWarehouseQuery implements BackfillSoftwareLicenseCodeTarget {
  private readonly client: warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new warehousingWarehouseQueryServiceApi.WarehouseQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: BackfillSoftwareLicenseCodeRecord): Promise<void> {
    await retry(() => call<warehousingWarehouseQueryServiceApi.PeekWarehouseRequest, warehousingWarehouseQueryServiceApi.PeekWarehouseResponse>(
      (request, done) => this.client.peekWarehouse(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      warehousingWarehouseQueryServiceApi.PeekWarehouseRequest.fromPartial({ warehouseId: record.message })));
  }
}

/** Writes records to acme.certificates.v1.CertificateService. */
class BackfillSoftwareLicenseCodeCertificate implements BackfillSoftwareLicenseCodeTarget {
  private readonly client: certificatesCertificateServiceApi.CertificateServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new certificatesCertificateServiceApi.CertificateServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: BackfillSoftwareLicenseCodeRecord): Promise<void> {
    await call<certificatesCertificateServiceApi.DeleteCertificateRequest, certificatesCertificateServiceApi.DeleteCertificateResponse>(
      (request, done) => this.client.deleteCertificate(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      certificatesCertificateServiceApi.DeleteCertificateRequest.fromPartial({ etag: record.softwareLicenseId, certificateId: record.correlationId }));
  }
}

/** Sends records to acme.content.v1.TaxonomyApprovalService. */
class BackfillSoftwareLicenseCodeTaxonomyApproval implements BackfillSoftwareLicenseCodeTarget {
  private readonly client: contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contentTaxonomyApprovalServiceApi.TaxonomyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: BackfillSoftwareLicenseCodeRecord): Promise<void> {
    await retry(() => call<contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalRequest, contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalResponse>(
      (request, done) => this.client.delegateTaxonomyApproval(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      contentTaxonomyApprovalServiceApi.DelegateTaxonomyApprovalRequest.fromPartial({ reason: record.softwareLicenseId, details: { comment: record.currencyCode } })));
  }
}

/** Only logs, for kinds no service takes yet. */
class BackfillSoftwareLicenseCodeLogOnly implements BackfillSoftwareLicenseCodeTarget {
  async send(record: BackfillSoftwareLicenseCodeRecord): Promise<void> {
    console.info("no sink for record", record.currencyCode);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchBackfillSoftwareLicenseCode(kind: string, record: BackfillSoftwareLicenseCodeRecord, runtime: Runtime): Promise<void> {
  let write = (item: BackfillSoftwareLicenseCodeRecord): Promise<void> => new BackfillSoftwareLicenseCodeLogOnly().send(item);
  switch (kind) {
    case "warehouse-query":
      write = (item) => new BackfillSoftwareLicenseCodeWarehouseQuery(runtime).send(item);
      break;
    case "certificate":
      write = (item) => new BackfillSoftwareLicenseCodeCertificate(runtime).send(item);
      break;
    case "taxonomy-approval":
      write = (item) => new BackfillSoftwareLicenseCodeTaxonomyApproval(runtime).send(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.licensing.v1.SoftwareLicenseService/CloneSoftwareLicense and hands what it keeps to the sink of
 * its kind.
 */
export async function backfillSoftwareLicenseCode(runtime: Runtime): Promise<void> {
  const upstream = new licensingSoftwareLicenseServiceApi.SoftwareLicenseServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await retry(() => call<licensingSoftwareLicenseServiceApi.CloneSoftwareLicenseRequest, licensingSoftwareLicenseServiceApi.CloneSoftwareLicenseResponse>(
    (request, done) => upstream.cloneSoftwareLicense(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    licensingSoftwareLicenseServiceApi.CloneSoftwareLicenseRequest.fromPartial({ requestId: "current-backfill-software-license-code" })));
  const record: BackfillSoftwareLicenseCodeRecord = {
    currencyCode: reply.softwareLicense?.currencyCode ?? "",
    message: reply.result?.message ?? "",
    softwareLicenseId: text.normalize(reply.softwareLicense?.softwareLicenseId ?? ""),
    correlationId: reply.result?.correlationId ?? "",
  };
  await dispatchBackfillSoftwareLicenseCode("taxonomy-approval", record, runtime);
}
