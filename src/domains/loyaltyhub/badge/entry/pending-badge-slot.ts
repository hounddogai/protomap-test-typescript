import * as text from "../../../../kit/text.js";

/** Where a pending badge slot is in its life cycle. */
export type PendingBadgeSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending badge slot. Its code is unique within a tenant. */
export class PendingBadgeSlot {
  code: string;
  label: string;
  clicks: number;
  conversionRate: number;
  approved: boolean;
  limit: number;
  status: PendingBadgeSlotStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    conversionRate: number,
    approved: boolean,
    limit: number,
    status: PendingBadgeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.approved = approved;
    this.limit = limit;
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

  canMoveTo(next: PendingBadgeSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
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

  moveTo(next: PendingBadgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending badge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.clicks + this.conversionRate) * 100) / 100;
  }

  copy(): PendingBadgeSlot {
    return new PendingBadgeSlot(
      this.code,
      this.label,
      this.clicks,
      this.conversionRate,
      this.approved,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending badge slot in status planned. */
export function newPendingBadgeSlot(code: string, label: string): PendingBadgeSlot {
  return new PendingBadgeSlot(code, label, 0, 0, false, 0, "planned");
}
