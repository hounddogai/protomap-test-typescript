import * as text from "../../../../kit/text.js";

/** Where a redemption audit is in its life cycle. */
export type RedemptionAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a redemption audit and its current status. */
export class RedemptionAudit {
  code: string;
  name: string;
  version: number;
  durationMinutes: number;
  capacity: number;
  currency: string;
  label: string;
  retries: number;
  timezone: string;
  locale: string;
  conversionRate: number;
  status: RedemptionAuditStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    durationMinutes: number,
    capacity: number,
    currency: string,
    label: string,
    retries: number,
    timezone: string,
    locale: string,
    conversionRate: number,
    status: RedemptionAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.capacity = capacity;
    this.currency = currency;
    this.label = label;
    this.retries = retries;
    this.timezone = timezone;
    this.locale = locale;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RedemptionAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RedemptionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"redemption audit"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.conversionRate * this.durationMinutes * 100) / 100;
  }

  copy(): RedemptionAudit {
    return new RedemptionAudit(
      this.code,
      this.name,
      this.version,
      this.durationMinutes,
      this.capacity,
      this.currency,
      this.label,
      this.retries,
      this.timezone,
      this.locale,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a redemption audit in status new. */
export function newRedemptionAudit(code: string, name: string): RedemptionAudit {
  return new RedemptionAudit(code, name, 0, 0, 0, "", "", 0, "", "", 0, "new");
}
