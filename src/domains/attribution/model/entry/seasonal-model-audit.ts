import * as text from "../../../../kit/text.js";

/** Where a seasonal model audit is in its life cycle. */
export type SeasonalModelAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal model audit as the model team keeps it. */
export class SeasonalModelAudit {
  code: string;
  label: string;
  conversionRate: number;
  quantity: number;
  contactEmail: string;
  budget: number;
  approved: boolean;
  score: number;
  bid: number;
  status: SeasonalModelAuditStatus;

  constructor(
    code: string,
    label: string,
    conversionRate: number,
    quantity: number,
    contactEmail: string,
    budget: number,
    approved: boolean,
    score: number,
    bid: number,
    status: SeasonalModelAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.approved = approved;
    this.score = score;
    this.bid = bid;
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

  canMoveTo(next: SeasonalModelAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalModelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal model audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal model audit"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.bid - this.budget) * 100) / 100;
  }

  copy(): SeasonalModelAudit {
    return new SeasonalModelAudit(
      this.code,
      this.label,
      this.conversionRate,
      this.quantity,
      this.contactEmail,
      this.budget,
      this.approved,
      this.score,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal model audit in status planned. */
export function newSeasonalModelAudit(code: string, label: string): SeasonalModelAudit {
  return new SeasonalModelAudit(code, label, 0, 0, "", 0, false, 0, 0, "planned");
}
