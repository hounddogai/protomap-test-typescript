import * as catalogProductCalculationServiceApi from "../../../.cache/proto/acme/catalog/v1/product_calculation_service.js";
import * as customersCustomerServiceApi from "../../../.cache/proto/acme/customers/v1/customer_service.js";
import * as performanceReviewServiceApi from "../../../.cache/proto/acme/performance/v1/review_service.js";
import * as surveysSurveyApprovalServiceApi from "../../../.cache/proto/acme/surveys/v1/survey_approval_service.js";
import { credentials } from "@grpc/grpc-js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What handOffProductsCode keeps of each RecalculateProducts response. */
interface HandOffProductsCodeRecord {
  code: string;
  message: string;
  correlationId: string;
  currencyCode: string;
}

/** Where handOffProductsCode hands each record. */
interface HandOffProductsCodeSink {
  push(record: HandOffProductsCodeRecord): Promise<void>;
}

/** Sends records to acme.surveys.v1.SurveyApprovalService. */
class HandOffProductsCodeSurveyApproval implements HandOffProductsCodeSink {
  private readonly client: surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new surveysSurveyApprovalServiceApi.SurveyApprovalServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffProductsCodeRecord): Promise<void> {
    await retry(() => call<surveysSurveyApprovalServiceApi.RecallSurveyRequest, surveysSurveyApprovalServiceApi.RecallSurveyResponse>(
      (request, done) => this.client.recallSurvey(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      surveysSurveyApprovalServiceApi.RecallSurveyRequest.fromPartial({ survey: { number: record.code, surveyId: record.message }, details: { approverEmail: record.currencyCode } })));
  }
}

/** Passes records to acme.customers.v1.CustomerService. */
class HandOffProductsCodeCustomer implements HandOffProductsCodeSink {
  private readonly client: customersCustomerServiceApi.CustomerServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new customersCustomerServiceApi.CustomerServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffProductsCodeRecord): Promise<void> {
    await retry(() => call<customersCustomerServiceApi.GetCustomerRequest, customersCustomerServiceApi.GetCustomerResponse>(
      (request, done) => this.client.getCustomer(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      customersCustomerServiceApi.GetCustomerRequest.fromPartial({ customerId: record.message })));
  }
}

/** Sends records to acme.performance.v1.ReviewService. */
class HandOffProductsCodeReview implements HandOffProductsCodeSink {
  private readonly client: performanceReviewServiceApi.ReviewServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new performanceReviewServiceApi.ReviewServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async push(record: HandOffProductsCodeRecord): Promise<void> {
    await call<performanceReviewServiceApi.UpdateReviewRequest, performanceReviewServiceApi.UpdateReviewResponse>(
      (request, done) => this.client.updateReview(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      performanceReviewServiceApi.UpdateReviewRequest.fromPartial({ review: { number: record.message, notes: record.code, reviewId: record.correlationId } }));
  }
}

/**
 * Reads acme.catalog.v1.ProductCalculationService/RecalculateProducts and hands what it keeps to the sink of
 * its kind.
 */
export async function handOffProductsCode(runtime: Runtime): Promise<void> {
  const source = new catalogProductCalculationServiceApi.ProductCalculationServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<catalogProductCalculationServiceApi.RecalculateProductsRequest, catalogProductCalculationServiceApi.RecalculateProductsResponse>(
    (request, done) => source.recalculateProducts(request, runtime.metadata, { deadline: Date.now() + 15_000 }, done),
    catalogProductCalculationServiceApi.RecalculateProductsRequest.fromPartial({ productId: "live-hand-off-products-code" }));
  const kept: HandOffProductsCodeRecord = {
    code: found.product?.code ?? "",
    message: found.result?.message ?? "",
    correlationId: found.result?.correlationId ?? "",
    currencyCode: found.breakdown?.currencyCode ?? "",
  };
  const registry: Record<string, HandOffProductsCodeSink> = {};
  for (const entry of [
    { kind: "survey-approval", sink: new HandOffProductsCodeSurveyApproval(runtime) },
    { kind: "customer", sink: new HandOffProductsCodeCustomer(runtime) },
    { kind: "review", sink: new HandOffProductsCodeReview(runtime) },
  ]) {
    registry[entry.kind] = entry.sink;
  }
  await registry["review"]!.push(kept);
}
