import * as text from "../../../../kit/text.js";

/** Where a manual streak entry is in its life cycle. */
export type ManualStreakEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A manual streak entry as the streak team keeps it. */
export class ManualStreakEntry {
  code: string;
  label: string;
  weight: number;
  threshold: number;
  approved: boolean;
  amount: number;
  updatedAt: number;
  createdAt: number;
  title: string;
  status: ManualStreakEntryStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    threshold: number,
    approved: boolean,
    amount: number,
    updatedAt: number,
    createdAt: number,
    title: string,
    status: ManualStreakEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.threshold = threshold;
    this.approved = approved;
    this.amount = amount;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.title = title;
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

  canMoveTo(next: ManualStreakEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualStreakEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual streak entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual streak entry"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.amount * this.createdAt * 100) / 100;
  }

  copy(): ManualStreakEntry {
    return new ManualStreakEntry(
      this.code,
      this.label,
      this.weight,
      this.threshold,
      this.approved,
      this.amount,
      this.updatedAt,
      this.createdAt,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual streak entry in status draft. */
export function newManualStreakEntry(code: string, label: string): ManualStreakEntry {
  return new ManualStreakEntry(code, label, 0, 0, false, 0, 0, 0, "", "draft");
}
