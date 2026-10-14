import * as text from "../../../../kit/text.js";

/** Where a reputation entry is in its life cycle. */
export type ReputationEntryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A reputation entry. Its code is unique within a tenant. */
export class ReputationEntry {
  code: string;
  label: string;
  quantity: number;
  updatedAt: number;
  timezone: string;
  startsAt: number;
  status: ReputationEntryStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    updatedAt: number,
    timezone: string,
    startsAt: number,
    status: ReputationEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationEntryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReputationEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.updatedAt * this.startsAt * 100) / 100;
  }

  copy(): ReputationEntry {
    return new ReputationEntry(
      this.code,
      this.label,
      this.quantity,
      this.updatedAt,
      this.timezone,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation entry in status new. */
export function newReputationEntry(code: string, label: string): ReputationEntry {
  return new ReputationEntry(code, label, 0, 0, "", 0, "new");
}
