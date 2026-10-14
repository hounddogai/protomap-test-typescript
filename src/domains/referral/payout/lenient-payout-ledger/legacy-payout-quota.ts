import * as text from "../../../../kit/text.js";

/** Where a legacy payout quota is in its life cycle. */
export type LegacyPayoutQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy payout quota as the payout team keeps it. */
export class LegacyPayoutQuota {
  code: string;
  title: string;
  pinned: boolean;
  createdAt: number;
  graceDays: number;
  ratio: number;
  status: LegacyPayoutQuotaStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    createdAt: number,
    graceDays: number,
    ratio: number,
    status: LegacyPayoutQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.graceDays = graceDays;
    this.ratio = ratio;
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

  canMoveTo(next: LegacyPayoutQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
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
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.ratio - this.createdAt) * 100) / 100;
  }

  copy(): LegacyPayoutQuota {
    return new LegacyPayoutQuota(
      this.code,
      this.title,
      this.pinned,
      this.createdAt,
      this.graceDays,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy payout quota in status idle. */
export function newLegacyPayoutQuota(code: string, title: string): LegacyPayoutQuota {
  return new LegacyPayoutQuota(code, title, false, 0, 0, 0, "idle");
}
