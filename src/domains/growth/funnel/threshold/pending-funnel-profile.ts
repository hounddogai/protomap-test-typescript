import * as text from "../../../../kit/text.js";

/** Where a pending funnel profile is in its life cycle. */
export type PendingFunnelProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pending funnel profile and its current status. */
export class PendingFunnelProfile {
  code: string;
  label: string;
  category: string;
  currency: string;
  discount: number;
  priority: number;
  durationMinutes: number;
  margin: number;
  status: PendingFunnelProfileStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    currency: string,
    discount: number,
    priority: number,
    durationMinutes: number,
    margin: number,
    status: PendingFunnelProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.currency = currency;
    this.discount = discount;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
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

  canMoveTo(next: PendingFunnelProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingFunnelProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending funnel profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending funnel profile"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.durationMinutes + this.margin) * 100) / 100;
  }

  copy(): PendingFunnelProfile {
    return new PendingFunnelProfile(
      this.code,
      this.label,
      this.category,
      this.currency,
      this.discount,
      this.priority,
      this.durationMinutes,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending funnel profile in status draft. */
export function newPendingFunnelProfile(code: string, label: string): PendingFunnelProfile {
  return new PendingFunnelProfile(code, label, "", "", 0, 0, 0, 0, "draft");
}
