import * as communityBadgeCalculationServiceApi from "../../../.cache/proto/acme/community/v1/badge_calculation_service.js";
import * as complianceComplianceCaseCalculationServiceApi from "../../../.cache/proto/acme/compliance/v1/compliance_case_calculation_service.js";
import * as venuesVenueServiceApi from "../../../.cache/proto/acme/venues/v1/venue_service.js";
import * as webbffWidgetLayoutIntegrationServiceApi from "../../../.cache/proto/acme/webbff/v1/widget_layout_integration_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What copyWidgetLayoutSourceMessage keeps of each ConnectWidgetLayoutSource response. */
interface CopyWidgetLayoutSourceMessageRecord {
  message: string;
  name: string;
  status: string;
  outcomeMessage: string;
}

/** Where copyWidgetLayoutSourceMessage hands each record. */
interface CopyWidgetLayoutSourceMessageTarget {
  forward(record: CopyWidgetLayoutSourceMessageRecord): Promise<void>;
}

/** Hands records to acme.venues.v1.VenueService. */
class CopyWidgetLayoutSourceMessageVenue implements CopyWidgetLayoutSourceMessageTarget {
  private readonly client: venuesVenueServiceApi.VenueServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new venuesVenueServiceApi.VenueServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyWidgetLayoutSourceMessageRecord): Promise<void> {
    await retry(() => call<venuesVenueServiceApi.CreateVenueRequest, venuesVenueServiceApi.CreateVenueResponse>(
      (request, done) => this.client.createVenue(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      venuesVenueServiceApi.CreateVenueRequest.fromPartial({ venue: { venueId: record.status } })));
  }
}

/** Hands records to acme.community.v1.BadgeCalculationService. */
class CopyWidgetLayoutSourceMessageBadgeCalculation implements CopyWidgetLayoutSourceMessageTarget {
  private readonly client: communityBadgeCalculationServiceApi.BadgeCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new communityBadgeCalculationServiceApi.BadgeCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyWidgetLayoutSourceMessageRecord): Promise<void> {
    await retry(() => call<communityBadgeCalculationServiceApi.CalculateBadgeRequest, communityBadgeCalculationServiceApi.CalculateBadgeResponse>(
      (request, done) => this.client.calculateBadge(request, this.runtime.metadata, { deadline: Date.now() + 15_000 }, done),
      communityBadgeCalculationServiceApi.CalculateBadgeRequest.fromPartial({ badge: { name: record.status, description: record.outcomeMessage }, badgeId: record.message })));
  }
}

/** Passes records to acme.compliance.v1.ComplianceCaseCalculationService. */
class CopyWidgetLayoutSourceMessageComplianceCaseCalculation implements CopyWidgetLayoutSourceMessageTarget {
  private readonly client: complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new complianceComplianceCaseCalculationServiceApi.ComplianceCaseCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async forward(record: CopyWidgetLayoutSourceMessageRecord): Promise<void> {
    await call<complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseRequest, complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseResponse>(
      (request, done) => this.client.quoteComplianceCase(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      complianceComplianceCaseCalculationServiceApi.QuoteComplianceCaseRequest.fromPartial({ complianceCase: { subject: record.status }, reason: record.outcomeMessage }));
  }
}

/**
 * Reads acme.webbff.v1.WidgetLayoutIntegrationService/ConnectWidgetLayoutSource and hands what it keeps to
 * the sink of its kind.
 */
export async function copyWidgetLayoutSourceMessage(runtime: Runtime): Promise<void> {
  const origin = new webbffWidgetLayoutIntegrationServiceApi.WidgetLayoutIntegrationServiceClient(runtime.mesh, credentials.createInsecure());
  const current = await call<webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest, webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceResponse>(
    (request, done) => origin.connectWidgetLayoutSource(request, runtime.metadata, { deadline: Date.now() + 20_000 }, done),
    webbffWidgetLayoutIntegrationServiceApi.ConnectWidgetLayoutSourceRequest.fromPartial({ reason: "current-copy-widget-layout-source-message" }));
  const row: CopyWidgetLayoutSourceMessageRecord = {
    message: text.normalize(current.result?.message ?? ""),
    name: current.widgetLayout?.name ?? "",
    status: current.result?.status ?? "",
    outcomeMessage: current.outcome?.message ?? "",
  };
  const entries: Array<{ kind: string; sink: CopyWidgetLayoutSourceMessageTarget }> = [
    { kind: "venue", sink: new CopyWidgetLayoutSourceMessageVenue(runtime) },
    { kind: "badge-calculation", sink: new CopyWidgetLayoutSourceMessageBadgeCalculation(runtime) },
    { kind: "compliance-case-calculation", sink: new CopyWidgetLayoutSourceMessageComplianceCaseCalculation(runtime) },
  ];
  for (const entry of entries) {
    if (entry.kind !== "badge-calculation") continue;
    await entry.sink.forward(row);
  }
}
