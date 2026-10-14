import * as text from "../../../../kit/text.js";

/** Where a paywall snapshot is in its life cycle. */
export type PaywallSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A paywall snapshot as the paywall team keeps it. */
export class PaywallSnapshot {
  code: string;
  label: string;
  journeyId: string;
  tags: string[];
  retries: number;
  windowDays: number;
  amount: number;
  createdAt: number;
  ceiling: number;
  variant: string;
  status: PaywallSnapshotStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    tags: string[],
    retries: number,
    windowDays: number,
    amount: number,
    createdAt: number,
    ceiling: number,
    variant: string,
    status: PaywallSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.tags = tags;
    this.retries = retries;
    this.windowDays = windowDays;
    this.amount = amount;
    this.createdAt = createdAt;
    this.ceiling = ceiling;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PaywallSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.ceiling) * 100) / 100;
  }

  copy(): PaywallSnapshot {
    return new PaywallSnapshot(
      this.code,
      this.label,
      this.journeyId,
      this.tags,
      this.retries,
      this.windowDays,
      this.amount,
      this.createdAt,
      this.ceiling,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall snapshot in status proposed. */
export function newPaywallSnapshot(code: string, label: string): PaywallSnapshot {
  return new PaywallSnapshot(code, label, "", [], 0, 0, 0, 0, 0, "", "proposed");
}
