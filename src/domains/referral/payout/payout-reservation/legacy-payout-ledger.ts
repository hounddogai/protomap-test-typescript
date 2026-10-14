import * as text from "../../../../kit/text.js";

/** Where a legacy payout ledger is in its life cycle. */
export type LegacyPayoutLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy payout ledger, with what the planners need to act on it. */
export class LegacyPayoutLedger {
  code: string;
  name: string;
  cost: number;
  campaignRef: string;
  timezone: string;
  channel: string;
  segment: string;
  status: LegacyPayoutLedgerStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    campaignRef: string,
    timezone: string,
    channel: string,
    segment: string,
    status: LegacyPayoutLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.channel = channel;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyPayoutLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyPayoutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): LegacyPayoutLedger {
    return new LegacyPayoutLedger(
      this.code,
      this.name,
      this.cost,
      this.campaignRef,
      this.timezone,
      this.channel,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy payout ledger in status proposed. */
export function newLegacyPayoutLedger(code: string, name: string): LegacyPayoutLedger {
  return new LegacyPayoutLedger(code, name, 0, "", "", "", "", "proposed");
}
