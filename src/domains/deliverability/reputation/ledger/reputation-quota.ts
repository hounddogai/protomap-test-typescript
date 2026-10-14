import * as text from "../../../../kit/text.js";

/** Where a reputation quota is in its life cycle. */
export type ReputationQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a reputation quota and its current status. */
export class ReputationQuota {
  code: string;
  name: string;
  ceiling: number;
  description: string;
  notes: string;
  discount: number;
  updatedAt: number;
  floorValue: number;
  segment: string;
  channel: string;
  status: ReputationQuotaStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    description: string,
    notes: string,
    discount: number,
    updatedAt: number,
    floorValue: number,
    segment: string,
    channel: string,
    status: ReputationQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.description = description;
    this.notes = notes;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.floorValue = floorValue;
    this.segment = segment;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReputationQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.discount - this.updatedAt) * 100) / 100;
  }

  copy(): ReputationQuota {
    return new ReputationQuota(
      this.code,
      this.name,
      this.ceiling,
      this.description,
      this.notes,
      this.discount,
      this.updatedAt,
      this.floorValue,
      this.segment,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a reputation quota in status open. */
export function newReputationQuota(code: string, name: string): ReputationQuota {
  return new ReputationQuota(code, name, 0, "", "", 0, 0, 0, "", "", "open");
}
