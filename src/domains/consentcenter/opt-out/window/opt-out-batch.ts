import * as text from "../../../../kit/text.js";

/** Where a opt out batch is in its life cycle. */
export type OptOutBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One opt out batch, with what the planners need to act on it. */
export class OptOutBatch {
  code: string;
  title: string;
  checksum: string;
  floorValue: number;
  pinned: boolean;
  attributes: Map<string, string>;
  phone: string;
  approved: boolean;
  graceDays: number;
  status: OptOutBatchStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    floorValue: number,
    pinned: boolean,
    attributes: Map<string, string>,
    phone: string,
    approved: boolean,
    graceDays: number,
    status: OptOutBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.attributes = attributes;
    this.phone = phone;
    this.approved = approved;
    this.graceDays = graceDays;
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

  canMoveTo(next: OptOutBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: OptOutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.floorValue * this.graceDays * 100) / 100;
  }

  copy(): OptOutBatch {
    return new OptOutBatch(
      this.code,
      this.title,
      this.checksum,
      this.floorValue,
      this.pinned,
      this.attributes,
      this.phone,
      this.approved,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a opt out batch in status planned. */
export function newOptOutBatch(code: string, title: string): OptOutBatch {
  return new OptOutBatch(code, title, "", 0, false, new Map<string, string>(), "", false, 0, "planned");
}
