import * as text from "../../../../kit/text.js";

/** Where a rolling complaint ledger is in its life cycle. */
export type RollingComplaintLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling complaint ledger, with what the planners need to act on it. */
export class RollingComplaintLedger {
  code: string;
  label: string;
  cost: number;
  clicks: number;
  openRate: number;
  sequence: number;
  attributes: Map<string, string>;
  impressions: number;
  status: RollingComplaintLedgerStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    clicks: number,
    openRate: number,
    sequence: number,
    attributes: Map<string, string>,
    impressions: number,
    status: RollingComplaintLedgerStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.clicks = clicks;
    this.openRate = openRate;
    this.sequence = sequence;
    this.attributes = attributes;
    this.impressions = impressions;
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

  canMoveTo(next: RollingComplaintLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingComplaintLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling complaint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling complaint ledger"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.cost - this.impressions) * 100) / 100;
  }

  copy(): RollingComplaintLedger {
    return new RollingComplaintLedger(
      this.code,
      this.label,
      this.cost,
      this.clicks,
      this.openRate,
      this.sequence,
      this.attributes,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling complaint ledger in status proposed. */
export function newRollingComplaintLedger(code: string, label: string): RollingComplaintLedger {
  return new RollingComplaintLedger(code, label, 0, 0, 0, 0, new Map<string, string>(), 0, "proposed");
}
