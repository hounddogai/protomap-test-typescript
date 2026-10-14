import * as text from "../../../../kit/text.js";

/** Where a credit snapshot is in its life cycle. */
export type CreditSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A credit snapshot. Its code is unique within a tenant. */
export class CreditSnapshot {
  code: string;
  title: string;
  openRate: number;
  discount: number;
  conversionRate: number;
  impressions: number;
  durationMinutes: number;
  capacity: number;
  status: CreditSnapshotStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    discount: number,
    conversionRate: number,
    impressions: number,
    durationMinutes: number,
    capacity: number,
    status: CreditSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.discount = discount;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
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

  canMoveTo(next: CreditSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.openRate - this.capacity) * 100) / 100;
  }

  copy(): CreditSnapshot {
    return new CreditSnapshot(
      this.code,
      this.title,
      this.openRate,
      this.discount,
      this.conversionRate,
      this.impressions,
      this.durationMinutes,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit snapshot in status planned. */
export function newCreditSnapshot(code: string, title: string): CreditSnapshot {
  return new CreditSnapshot(code, title, 0, 0, 0, 0, 0, 0, "planned");
}
