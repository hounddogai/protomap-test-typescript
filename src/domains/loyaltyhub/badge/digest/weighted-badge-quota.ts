import * as text from "../../../../kit/text.js";

/** Where a weighted badge quota is in its life cycle. */
export type WeightedBadgeQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a weighted badge quota and its current status. */
export class WeightedBadgeQuota {
  code: string;
  name: string;
  category: string;
  checksum: string;
  locale: string;
  channel: string;
  sendAt: number;
  status: WeightedBadgeQuotaStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    checksum: string,
    locale: string,
    channel: string,
    sendAt: number,
    status: WeightedBadgeQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.checksum = checksum;
    this.locale = locale;
    this.channel = channel;
    this.sendAt = sendAt;
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

  canMoveTo(next: WeightedBadgeQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedBadgeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted badge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted badge quota"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): WeightedBadgeQuota {
    return new WeightedBadgeQuota(
      this.code,
      this.name,
      this.category,
      this.checksum,
      this.locale,
      this.channel,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted badge quota in status idle. */
export function newWeightedBadgeQuota(code: string, name: string): WeightedBadgeQuota {
  return new WeightedBadgeQuota(code, name, "", "", "", "", 0, "idle");
}
