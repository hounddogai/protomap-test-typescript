import * as text from "../../../../kit/text.js";

/** Where a lenient reply entry is in its life cycle. */
export type LenientReplyEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient reply entry. Its code is unique within a tenant. */
export class LenientReplyEntry {
  code: string;
  name: string;
  clicks: number;
  updatedAt: number;
  frequencyCap: number;
  status: LenientReplyEntryStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    updatedAt: number,
    frequencyCap: number,
    status: LenientReplyEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: LenientReplyEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientReplyEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reply entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.updatedAt + this.frequencyCap) * 100) / 100;
  }

  copy(): LenientReplyEntry {
    return new LenientReplyEntry(this.code, this.name, this.clicks, this.updatedAt, this.frequencyCap, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient reply entry in status planned. */
export function newLenientReplyEntry(code: string, name: string): LenientReplyEntry {
  return new LenientReplyEntry(code, name, 0, 0, 0, "planned");
}
