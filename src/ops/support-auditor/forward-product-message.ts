import * as boxofficeBoxOfficeSaleQueryServiceApi from "../../../.cache/proto/acme/boxoffice/v1/box_office_sale_query_service.js";
import * as catalogProductCalculationServiceApi from "../../../.cache/proto/acme/catalog/v1/product_calculation_service.js";
import * as chatChatBotApprovalServiceApi from "../../../.cache/proto/acme/chat/v1/chat_bot_approval_service.js";
import * as localizationTranslationKeyApprovalServiceApi from "../../../.cache/proto/acme/localization/v1/translation_key_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What forwardProductMessage keeps of each SimulateProduct response. */
interface ForwardProductMessageRecord {
  message: string;
  currencyCode: string;
}

/** Where forwardProductMessage hands each record. */
interface ForwardProductMessageTarget {
  forward(record: ForwardProductMessageRecord): Promise<void>;
}

/** Passes records to acme.localization.v1.TranslationKeyApprovalService. */
class ForwardProductMessageTranslationKeyApproval implements ForwardProductMessageTarget {
  private readonly client: localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new localizationTranslationKeyApprovalServiceApi.TranslationKeyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardProductMessageRecord): Promise<void> {
    await call<localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyRequest, localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyResponse>(
      (request, done) => this.client.approveTranslationKey(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      localizationTranslationKeyApprovalServiceApi.ApproveTranslationKeyRequest.fromPartial({ translationKey: { name: record.currencyCode } }));
  }
}

/** Sends records to acme.chat.v1.ChatBotApprovalService. */
class ForwardProductMessageChatBotApproval implements ForwardProductMessageTarget {
  private readonly client: chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new chatChatBotApprovalServiceApi.ChatBotApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardProductMessageRecord): Promise<void> {
    await call<chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest, chatChatBotApprovalServiceApi.CommentChatBotApprovalResponse>(
      (request, done) => this.client.commentChatBotApproval(request, this.runtime.metadata, { deadline: Date.now() + 30_000 }, done),
      chatChatBotApprovalServiceApi.CommentChatBotApprovalRequest.fromPartial({ details: { approverEmail: record.currencyCode }, reason: record.message }));
  }
}

/** Passes records to acme.boxoffice.v1.BoxOfficeSaleQueryService. */
class ForwardProductMessageBoxOfficeSaleQuery implements ForwardProductMessageTarget {
  private readonly client: boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new boxofficeBoxOfficeSaleQueryServiceApi.BoxOfficeSaleQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: ForwardProductMessageRecord): Promise<void> {
    await retry(() => call<boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleRequest, boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleResponse>(
      (request, done) => this.client.peekBoxOfficeSale(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      boxofficeBoxOfficeSaleQueryServiceApi.PeekBoxOfficeSaleRequest.fromPartial({ boxOfficeSaleId: record.currencyCode })));
  }
}

/** Only logs, for kinds no service takes yet. */
class ForwardProductMessageLogOnly implements ForwardProductMessageTarget {
  async forward(record: ForwardProductMessageRecord): Promise<void> {
    console.info("no sink for record", record.message);
  }
}

/** Hands a record to the sink of its kind. */
async function deliverForwardProductMessage(kind: string, record: ForwardProductMessageRecord, runtime: Runtime): Promise<void> {
  let sink: ForwardProductMessageTarget = new ForwardProductMessageLogOnly();
  switch (kind) {
    case "translation-key-approval":
      sink = new ForwardProductMessageTranslationKeyApproval(runtime);
      break;
    case "chat-bot-approval":
      sink = new ForwardProductMessageChatBotApproval(runtime);
      break;
    case "box-office-sale-query":
      sink = new ForwardProductMessageBoxOfficeSaleQuery(runtime);
      break;
  }
  await sink.forward(record);
}

/**
 * Reads acme.catalog.v1.ProductCalculationService/SimulateProduct and hands what it keeps to the sink of its
 * kind.
 */
export async function forwardProductMessage(runtime: Runtime): Promise<void> {
  const upstream = new catalogProductCalculationServiceApi.ProductCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const reply = await call<catalogProductCalculationServiceApi.SimulateProductRequest, catalogProductCalculationServiceApi.SimulateProductResponse>(
    (request, done) => upstream.simulateProduct(request, runtime.metadata, { deadline: Date.now() + 30_000 }, done),
    catalogProductCalculationServiceApi.SimulateProductRequest.fromPartial({ reason: "current-forward-product-message" }));
  const record: ForwardProductMessageRecord = {
    message: reply.result?.message ?? "",
    currencyCode: reply.breakdown?.currencyCode ?? "",
  };
  await deliverForwardProductMessage("chat-bot-approval", record, runtime);
}
