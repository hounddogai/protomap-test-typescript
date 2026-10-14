import * as text from "../../../../kit/text.js";

/** Where a strict csat quota is in its life cycle. */
export type StrictCsatQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict csat quota. Its code is unique within a tenant. */
export class StrictCsatQuota {
  code: string;
  name: string;
  maximum: number;
  graceDays: number;
  variant: string;
  channel: string;
  utmSource: string;
  weight: number;
  status: StrictCsatQuotaStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    graceDays: number,
    variant: string,
    channel: string,
    utmSource: string,
    weight: number,
    status: StrictCsatQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.variant = variant;
    this.channel = channel;
    this.utmSource = utmSource;
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

  canMoveTo(next: StrictCsatQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictCsatQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict csat quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict csat quota"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.maximum - this.graceDays) * 100) / 100;
  }

  copy(): StrictCsatQuota {
    return new StrictCsatQuota(
      this.code,
      this.name,
      this.maximum,
      this.graceDays,
      this.variant,
      this.channel,
      this.utmSource,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict csat quota in status idle. */
export function newStrictCsatQuota(code: string, name: string): StrictCsatQuota {
  return new StrictCsatQuota(code, name, 0, 0, "", "", "", 0, "idle");
}
