import * as text from "../../../../kit/text.js";
import { LegacyPayoutLedger } from "./legacy-payout-ledger.js";

/** How screens and exports show a legacy payout ledger. */
export class LegacyPayoutLedgerView {
  code: string;
  nameText: string;
  cost: string;
  campaignRef: string;
  timezone: string;
  channelText: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    cost: string,
    campaignRef: string,
    timezone: string,
    channelText: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.cost = cost;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.channelText = channelText;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPayoutLedgerView(item: LegacyPayoutLedger): LegacyPayoutLedgerView {
  return new LegacyPayoutLedgerView(
    item.code,
    item.name,
    item.cost.toFixed(2),
    text.truncate(item.campaignRef, 80),
    item.timezone,
    item.channel,
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPayoutLedgerViews(items: LegacyPayoutLedger[]): LegacyPayoutLedgerView[] {
  const views: LegacyPayoutLedgerView[] = [];
  for (const item of items) {
    views.push(toLegacyPayoutLedgerView(item));
  }
  return views;
}

export function sumLegacyPayoutLedgerView(view: LegacyPayoutLedgerView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedCost;
}
