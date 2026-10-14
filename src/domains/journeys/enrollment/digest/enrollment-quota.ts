import * as text from "../../../../kit/text.js";

/** Where a enrollment quota is in its life cycle. */
export type EnrollmentQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a enrollment quota and its current status. */
export class EnrollmentQuota {
  code: string;
  label: string;
  graceDays: number;
  clicks: number;
  visible: boolean;
  archived: boolean;
  variant: string;
  sequence: number;
  cost: number;
  approved: boolean;
  openRate: number;
  status: EnrollmentQuotaStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    clicks: number,
    visible: boolean,
    archived: boolean,
    variant: string,
    sequence: number,
    cost: number,
    approved: boolean,
    openRate: number,
    status: EnrollmentQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.visible = visible;
    this.archived = archived;
    this.variant = variant;
    this.sequence = sequence;
    this.cost = cost;
    this.approved = approved;
    this.openRate = openRate;
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

  canMoveTo(next: EnrollmentQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"enrollment quota"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.clicks + this.sequence) * 100) / 100;
  }

  copy(): EnrollmentQuota {
    return new EnrollmentQuota(
      this.code,
      this.label,
      this.graceDays,
      this.clicks,
      this.visible,
      this.archived,
      this.variant,
      this.sequence,
      this.cost,
      this.approved,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment quota in status planned. */
export function newEnrollmentQuota(code: string, label: string): EnrollmentQuota {
  return new EnrollmentQuota(code, label, 0, 0, false, false, "", 0, 0, false, 0, "planned");
}
