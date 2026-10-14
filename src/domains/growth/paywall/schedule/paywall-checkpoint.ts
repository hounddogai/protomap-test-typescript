import * as text from "../../../../kit/text.js";

/** Where a paywall checkpoint is in its life cycle. */
export type PaywallCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A paywall checkpoint as the paywall team keeps it. */
export class PaywallCheckpoint {
  code: string;
  title: string;
  unit: string;
  currency: string;
  startsAt: number;
  openRate: number;
  clicks: number;
  timezone: string;
  status: PaywallCheckpointStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    currency: string,
    startsAt: number,
    openRate: number,
    clicks: number,
    timezone: string,
    status: PaywallCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.currency = currency;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.clicks = clicks;
    this.timezone = timezone;
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

  canMoveTo(next: PaywallCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: PaywallCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.clicks - this.openRate) * 100) / 100;
  }

  copy(): PaywallCheckpoint {
    return new PaywallCheckpoint(
      this.code,
      this.title,
      this.unit,
      this.currency,
      this.startsAt,
      this.openRate,
      this.clicks,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a paywall checkpoint in status idle. */
export function newPaywallCheckpoint(code: string, title: string): PaywallCheckpoint {
  return new PaywallCheckpoint(code, title, "", "", 0, 0, 0, "", "idle");
}
