import * as text from "../../../../kit/text.js";

/** Where a regional approval group is in its life cycle. */
export type RegionalApprovalGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional approval group, with what the planners need to act on it. */
export class RegionalApprovalGroup {
  code: string;
  label: string;
  endsAt: number;
  title: string;
  segment: string;
  audienceId: string;
  conversionRate: number;
  cost: number;
  discount: number;
  graceDays: number;
  status: RegionalApprovalGroupStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    title: string,
    segment: string,
    audienceId: string,
    conversionRate: number,
    cost: number,
    discount: number,
    graceDays: number,
    status: RegionalApprovalGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.title = title;
    this.segment = segment;
    this.audienceId = audienceId;
    this.conversionRate = conversionRate;
    this.cost = cost;
    this.discount = discount;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalApprovalGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalApprovalGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.endsAt * this.cost * 100) / 100;
  }

  copy(): RegionalApprovalGroup {
    return new RegionalApprovalGroup(
      this.code,
      this.label,
      this.endsAt,
      this.title,
      this.segment,
      this.audienceId,
      this.conversionRate,
      this.cost,
      this.discount,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a regional approval group in status requested. */
export function newRegionalApprovalGroup(code: string, label: string): RegionalApprovalGroup {
  return new RegionalApprovalGroup(code, label, 0, "", "", "", 0, 0, 0, 0, "requested");
}
