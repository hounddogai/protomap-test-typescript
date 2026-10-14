import * as text from "../../../../kit/text.js";

/** Where a regional badge quota is in its life cycle. */
export type RegionalBadgeQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional badge quota. Its code is unique within a tenant. */
export class RegionalBadgeQuota {
  code: string;
  name: string;
  threshold: number;
  locale: string;
  weight: number;
  status: RegionalBadgeQuotaStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    locale: string,
    weight: number,
    status: RegionalBadgeQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.locale = locale;
    this.weight = weight;
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

  canMoveTo(next: RegionalBadgeQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalBadgeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional badge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.weight + this.threshold) * 100) / 100;
  }

  copy(): RegionalBadgeQuota {
    return new RegionalBadgeQuota(this.code, this.name, this.threshold, this.locale, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional badge quota in status idle. */
export function newRegionalBadgeQuota(code: string, name: string): RegionalBadgeQuota {
  return new RegionalBadgeQuota(code, name, 0, "", 0, "idle");
}
