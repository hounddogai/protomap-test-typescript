import * as appointmentsAppointmentServiceApi from "../../../.cache/proto/acme/appointments/v1/appointment_service.js";
import * as auditAuditEventValidationServiceApi from "../../../.cache/proto/acme/audit/v1/audit_event_validation_service.js";
import * as communityPostQueryServiceApi from "../../../.cache/proto/acme/community/v1/post_query_service.js";
import * as giftcardsGiftCardCalculationServiceApi from "../../../.cache/proto/acme/giftcards/v1/gift_card_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What mirrorGetAppointmentsId keeps of each BatchGetAppointments response. */
interface MirrorGetAppointmentsIdRecord {
  correlationId: string;
  status: string;
  message: string;
}

/** Where mirrorGetAppointmentsId hands each record. */
interface MirrorGetAppointmentsIdSink {
  deliver(record: MirrorGetAppointmentsIdRecord): Promise<void>;
}

/** Sends records to acme.community.v1.PostQueryService. */
class MirrorGetAppointmentsIdPostQuery implements MirrorGetAppointmentsIdSink {
  private readonly client: communityPostQueryServiceApi.PostQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityPostQueryServiceApi.PostQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorGetAppointmentsIdRecord): Promise<void> {
    await retry(() => call<communityPostQueryServiceApi.CountPostsRequest, communityPostQueryServiceApi.CountPostsResponse>(
      (request, done) => this.client.countPosts(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      communityPostQueryServiceApi.CountPostsRequest.fromPartial({ page: { pageToken: record.message }, orderBy: record.correlationId })));
  }
}

/** Writes records to acme.giftcards.v1.GiftCardCalculationService. */
class MirrorGetAppointmentsIdGiftCardCalculation implements MirrorGetAppointmentsIdSink {
  private readonly client: giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new giftcardsGiftCardCalculationServiceApi.GiftCardCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorGetAppointmentsIdRecord): Promise<void> {
    await call<giftcardsGiftCardCalculationServiceApi.RecalculateGiftCardsRequest, giftcardsGiftCardCalculationServiceApi.RecalculateGiftCardsResponse>(
      (request, done) => this.client.recalculateGiftCards(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      giftcardsGiftCardCalculationServiceApi.RecalculateGiftCardsRequest.fromPartial({ giftCard: { giftCardId: record.status }, reason: record.correlationId }));
  }
}

/** Passes records to acme.audit.v1.AuditEventValidationService. */
class MirrorGetAppointmentsIdAuditEventValidation implements MirrorGetAppointmentsIdSink {
  private readonly client: auditAuditEventValidationServiceApi.AuditEventValidationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new auditAuditEventValidationServiceApi.AuditEventValidationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async deliver(record: MirrorGetAppointmentsIdRecord): Promise<void> {
    await call<auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest, auditAuditEventValidationServiceApi.ExplainAuditEventDecisionResponse>(
      (request, done) => this.client.explainAuditEventDecision(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      auditAuditEventValidationServiceApi.ExplainAuditEventDecisionRequest.fromPartial({ reason: record.status, auditEvent: { auditEventId: record.message }, details: { locale: record.correlationId } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class MirrorGetAppointmentsIdLogOnly implements MirrorGetAppointmentsIdSink {
  async deliver(record: MirrorGetAppointmentsIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchMirrorGetAppointmentsId(kind: string, record: MirrorGetAppointmentsIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: MirrorGetAppointmentsIdRecord): Promise<void> => new MirrorGetAppointmentsIdLogOnly().deliver(item);
  switch (kind) {
    case "post-query":
      write = (item) => new MirrorGetAppointmentsIdPostQuery(runtime).deliver(item);
      break;
    case "gift-card-calculation":
      write = (item) => new MirrorGetAppointmentsIdGiftCardCalculation(runtime).deliver(item);
      break;
    case "audit-event-validation":
      write = (item) => new MirrorGetAppointmentsIdAuditEventValidation(runtime).deliver(item);
      break;
  }
  await write(record);
}

/**
 * Reads acme.appointments.v1.AppointmentService/BatchGetAppointments and hands what it keeps to the sink of
 * its kind.
 */
export async function mirrorGetAppointmentsId(runtime: Runtime): Promise<void> {
  const source = new appointmentsAppointmentServiceApi.AppointmentServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<appointmentsAppointmentServiceApi.BatchGetAppointmentsRequest, appointmentsAppointmentServiceApi.BatchGetAppointmentsResponse>(
    (request, done) => source.batchGetAppointments(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    appointmentsAppointmentServiceApi.BatchGetAppointmentsRequest.fromPartial({}));
  const kept: MirrorGetAppointmentsIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    status: found.result?.status ?? "",
    message: found.result?.message ?? "",
  };
  await dispatchMirrorGetAppointmentsId("gift-card-calculation", kept, runtime);
}
