import * as text from "../../../../kit/text.js";

/** Where a manual retention ledger is in its life cycle. */
export type ManualRetentionLedgerStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual retention ledger. Its code is unique within a tenant. */
export class ManualRetentionLedger {
  code: string;
  title: string;
  quantity: number;
  reviewer: string;
  budget: number;
  pinned: boolean;
  impressions: number;
  label: string;
  description: string;
  floorValue: number;
  status: ManualRetentionLedgerStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    reviewer: string,
    budget: number,
    pinned: boolean,
    impressions: number,
    label: string,
    description: string,
    floorValue: number,
    status: ManualRetentionLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.budget = budget;
    this.pinned = pinned;
    this.impressions = impressions;
    this.label = label;
    this.description = description;
    this.floorValue = floorValue;
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

  canMoveTo(next: ManualRetentionLedgerStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualRetentionLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.quantity - this.impressions) * 100) / 100;
  }

  copy(): ManualRetentionLedger {
    return new ManualRetentionLedger(
      this.code,
      this.title,
      this.quantity,
      this.reviewer,
      this.budget,
      this.pinned,
      this.impressions,
      this.label,
      this.description,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual retention ledger in status planned. */
export function newManualRetentionLedger(code: string, title: string): ManualRetentionLedger {
  return new ManualRetentionLedger(code, title, 0, "", 0, false, 0, "", "", 0, "planned");
}
