import * as text from "../../../../kit/text.js";

/** Where a pending funnel adjustment is in its life cycle. */
export type PendingFunnelAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A pending funnel adjustment. Its code is unique within a tenant. */
export class PendingFunnelAdjustment {
  code: string;
  title: string;
  checksum: string;
  impressions: number;
  active: boolean;
  quantity: number;
  status: PendingFunnelAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    impressions: number,
    active: boolean,
    quantity: number,
    status: PendingFunnelAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.impressions = impressions;
    this.active = active;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingFunnelAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingFunnelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending funnel adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions + this.quantity) * 100) / 100;
  }

  copy(): PendingFunnelAdjustment {
    return new PendingFunnelAdjustment(
      this.code,
      this.title,
      this.checksum,
      this.impressions,
      this.active,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending funnel adjustment in status created. */
export function newPendingFunnelAdjustment(code: string, title: string): PendingFunnelAdjustment {
  return new PendingFunnelAdjustment(code, title, "", 0, false, 0, "created");
}
