import * as text from "../../../../kit/text.js";

/** Where a bid rule snapshot is in its life cycle. */
export type BidRuleSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A bid rule snapshot as the bid rule team keeps it. */
export class BidRuleSnapshot {
  code: string;
  label: string;
  locale: string;
  bid: number;
  durationMinutes: number;
  country: string;
  audienceId: string;
  maximum: number;
  variant: string;
  status: BidRuleSnapshotStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    bid: number,
    durationMinutes: number,
    country: string,
    audienceId: string,
    maximum: number,
    variant: string,
    status: BidRuleSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.country = country;
    this.audienceId = audienceId;
    this.maximum = maximum;
    this.variant = variant;
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

  canMoveTo(next: BidRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BidRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round(this.bid * this.maximum * 100) / 100;
  }

  copy(): BidRuleSnapshot {
    return new BidRuleSnapshot(
      this.code,
      this.label,
      this.locale,
      this.bid,
      this.durationMinutes,
      this.country,
      this.audienceId,
      this.maximum,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule snapshot in status proposed. */
export function newBidRuleSnapshot(code: string, label: string): BidRuleSnapshot {
  return new BidRuleSnapshot(code, label, "", 0, 0, "", "", 0, "", "proposed");
}
