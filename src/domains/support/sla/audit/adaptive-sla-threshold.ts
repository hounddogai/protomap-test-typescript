import * as text from "../../../../kit/text.js";

/** Where a adaptive sla threshold is in its life cycle. */
export type AdaptiveSlaThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive sla threshold, with what the planners need to act on it. */
export class AdaptiveSlaThreshold {
  code: string;
  name: string;
  minimum: number;
  updatedAt: number;
  currency: string;
  status: AdaptiveSlaThresholdStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    updatedAt: number,
    currency: string,
    status: AdaptiveSlaThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSlaThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveSlaThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sla threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive sla threshold"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.updatedAt - this.minimum) * 100) / 100;
  }

  copy(): AdaptiveSlaThreshold {
    return new AdaptiveSlaThreshold(this.code, this.name, this.minimum, this.updatedAt, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive sla threshold in status draft. */
export function newAdaptiveSlaThreshold(code: string, name: string): AdaptiveSlaThreshold {
  return new AdaptiveSlaThreshold(code, name, 0, 0, "", "draft");
}
