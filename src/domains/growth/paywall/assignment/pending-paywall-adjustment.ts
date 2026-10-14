import * as text from "../../../../kit/text.js";

/** Where a pending paywall adjustment is in its life cycle. */
export type PendingPaywallAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending paywall adjustment and its current status. */
export class PendingPaywallAdjustment {
  code: string;
  name: string;
  segment: string;
  phone: string;
  visible: boolean;
  batchSize: number;
  graceDays: number;
  status: PendingPaywallAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    phone: string,
    visible: boolean,
    batchSize: number,
    graceDays: number,
    status: PendingPaywallAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.phone = phone;
    this.visible = visible;
    this.batchSize = batchSize;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPaywallAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingPaywallAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending paywall adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending paywall adjustment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.batchSize * this.graceDays * 100) / 100;
  }

  copy(): PendingPaywallAdjustment {
    return new PendingPaywallAdjustment(
      this.code,
      this.name,
      this.segment,
      this.phone,
      this.visible,
      this.batchSize,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending paywall adjustment in status idle. */
export function newPendingPaywallAdjustment(code: string, name: string): PendingPaywallAdjustment {
  return new PendingPaywallAdjustment(code, name, "", "", false, 0, 0, "idle");
}
