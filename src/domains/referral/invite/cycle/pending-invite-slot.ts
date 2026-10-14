import * as text from "../../../../kit/text.js";

/** Where a pending invite slot is in its life cycle. */
export type PendingInviteSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One pending invite slot, with what the planners need to act on it. */
export class PendingInviteSlot {
  code: string;
  title: string;
  retries: number;
  locale: string;
  batchSize: number;
  notes: string;
  margin: number;
  sequence: number;
  conversionRate: number;
  priority: number;
  status: PendingInviteSlotStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    locale: string,
    batchSize: number,
    notes: string,
    margin: number,
    sequence: number,
    conversionRate: number,
    priority: number,
    status: PendingInviteSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.locale = locale;
    this.batchSize = batchSize;
    this.notes = notes;
    this.margin = margin;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.priority = priority;
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

  canMoveTo(next: PendingInviteSlotStatus): boolean {
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

  moveTo(next: PendingInviteSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending invite slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round((this.margin - this.conversionRate) * 100) / 100;
  }

  copy(): PendingInviteSlot {
    return new PendingInviteSlot(
      this.code,
      this.title,
      this.retries,
      this.locale,
      this.batchSize,
      this.notes,
      this.margin,
      this.sequence,
      this.conversionRate,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending invite slot in status draft. */
export function newPendingInviteSlot(code: string, title: string): PendingInviteSlot {
  return new PendingInviteSlot(code, title, 0, "", 0, "", 0, 0, 0, 0, "draft");
}
