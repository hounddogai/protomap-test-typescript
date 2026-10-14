import * as text from "../../../../kit/text.js";

/** Where a legacy retention quota is in its life cycle. */
export type LegacyRetentionQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy retention quota as the retention team keeps it. */
export class LegacyRetentionQuota {
  code: string;
  title: string;
  ratio: number;
  description: string;
  journeyId: string;
  visible: boolean;
  bid: number;
  approved: boolean;
  discount: number;
  status: LegacyRetentionQuotaStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    description: string,
    journeyId: string,
    visible: boolean,
    bid: number,
    approved: boolean,
    discount: number,
    status: LegacyRetentionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.description = description;
    this.journeyId = journeyId;
    this.visible = visible;
    this.bid = bid;
    this.approved = approved;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyRetentionQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LegacyRetentionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy retention quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.ratio - this.bid) * 100) / 100;
  }

  copy(): LegacyRetentionQuota {
    return new LegacyRetentionQuota(
      this.code,
      this.title,
      this.ratio,
      this.description,
      this.journeyId,
      this.visible,
      this.bid,
      this.approved,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy retention quota in status planned. */
export function newLegacyRetentionQuota(code: string, title: string): LegacyRetentionQuota {
  return new LegacyRetentionQuota(code, title, 0, "", "", false, 0, false, 0, "planned");
}
