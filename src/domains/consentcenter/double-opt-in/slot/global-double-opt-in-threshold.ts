import * as text from "../../../../kit/text.js";

/** Where a global double opt in threshold is in its life cycle. */
export type GlobalDoubleOptInThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One global double opt in threshold, with what the planners need to act on it. */
export class GlobalDoubleOptInThreshold {
  code: string;
  name: string;
  windowDays: number;
  amount: number;
  revision: number;
  timezone: string;
  source: string;
  impressions: number;
  ceiling: number;
  status: GlobalDoubleOptInThresholdStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    amount: number,
    revision: number,
    timezone: string,
    source: string,
    impressions: number,
    ceiling: number,
    status: GlobalDoubleOptInThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.amount = amount;
    this.revision = revision;
    this.timezone = timezone;
    this.source = source;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalDoubleOptInThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalDoubleOptInThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global double opt in threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.revision + this.amount) * 100) / 100;
  }

  copy(): GlobalDoubleOptInThreshold {
    return new GlobalDoubleOptInThreshold(
      this.code,
      this.name,
      this.windowDays,
      this.amount,
      this.revision,
      this.timezone,
      this.source,
      this.impressions,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global double opt in threshold in status requested. */
export function newGlobalDoubleOptInThreshold(code: string, name: string): GlobalDoubleOptInThreshold {
  return new GlobalDoubleOptInThreshold(code, name, 0, 0, 0, "", "", 0, 0, "requested");
}
