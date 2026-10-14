import * as text from "../../../../kit/text.js";

/** Where a pending sender entry is in its life cycle. */
export type PendingSenderEntryStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending sender entry. Its code is unique within a tenant. */
export class PendingSenderEntry {
  code: string;
  label: string;
  retries: number;
  segment: string;
  createdAt: number;
  bid: number;
  title: string;
  status: PendingSenderEntryStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    segment: string,
    createdAt: number,
    bid: number,
    title: string,
    status: PendingSenderEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.segment = segment;
    this.createdAt = createdAt;
    this.bid = bid;
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

  canMoveTo(next: PendingSenderEntryStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: PendingSenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.bid * this.retries * 100) / 100;
  }

  copy(): PendingSenderEntry {
    return new PendingSenderEntry(
      this.code,
      this.label,
      this.retries,
      this.segment,
      this.createdAt,
      this.bid,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending sender entry in status draft. */
export function newPendingSenderEntry(code: string, label: string): PendingSenderEntry {
  return new PendingSenderEntry(code, label, 0, "", 0, 0, "", "draft");
}
