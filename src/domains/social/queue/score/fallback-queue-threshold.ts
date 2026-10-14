import * as text from "../../../../kit/text.js";

/** Where a fallback queue threshold is in its life cycle. */
export type FallbackQueueThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback queue threshold and its current status. */
export class FallbackQueueThreshold {
  code: string;
  label: string;
  rate: number;
  active: boolean;
  pinned: boolean;
  openRate: number;
  discount: number;
  archived: boolean;
  category: string;
  approved: boolean;
  phone: string;
  status: FallbackQueueThresholdStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    active: boolean,
    pinned: boolean,
    openRate: number,
    discount: number,
    archived: boolean,
    category: string,
    approved: boolean,
    phone: string,
    status: FallbackQueueThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.active = active;
    this.pinned = pinned;
    this.openRate = openRate;
    this.discount = discount;
    this.archived = archived;
    this.category = category;
    this.approved = approved;
    this.phone = phone;
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

  canMoveTo(next: FallbackQueueThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackQueueThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback queue threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.openRate - this.discount) * 100) / 100;
  }

  copy(): FallbackQueueThreshold {
    return new FallbackQueueThreshold(
      this.code,
      this.label,
      this.rate,
      this.active,
      this.pinned,
      this.openRate,
      this.discount,
      this.archived,
      this.category,
      this.approved,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback queue threshold in status new. */
export function newFallbackQueueThreshold(code: string, label: string): FallbackQueueThreshold {
  return new FallbackQueueThreshold(code, label, 0, false, false, 0, 0, false, "", false, "", "new");
}
