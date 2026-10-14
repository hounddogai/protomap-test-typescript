import * as text from "../../../../kit/text.js";

/** Where a scheduled tier ledger is in its life cycle. */
export type ScheduledTierLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a scheduled tier ledger and its current status. */
export class ScheduledTierLedger {
  code: string;
  name: string;
  tags: string[];
  weight: number;
  contactEmail: string;
  campaignRef: string;
  amount: number;
  impressions: number;
  status: ScheduledTierLedgerStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    weight: number,
    contactEmail: string,
    campaignRef: string,
    amount: number,
    impressions: number,
    status: ScheduledTierLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.weight = weight;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.amount = amount;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledTierLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledTierLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled tier ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.impressions - this.amount) * 100) / 100;
  }

  copy(): ScheduledTierLedger {
    return new ScheduledTierLedger(
      this.code,
      this.name,
      this.tags,
      this.weight,
      this.contactEmail,
      this.campaignRef,
      this.amount,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled tier ledger in status draft. */
export function newScheduledTierLedger(code: string, name: string): ScheduledTierLedger {
  return new ScheduledTierLedger(code, name, [], 0, "", "", 0, 0, "draft");
}
