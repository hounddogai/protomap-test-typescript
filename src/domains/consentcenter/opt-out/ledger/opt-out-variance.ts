import * as text from "../../../../kit/text.js";

/** Where a opt out variance is in its life cycle. */
export type OptOutVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A opt out variance. Its code is unique within a tenant. */
export class OptOutVariance {
  code: string;
  name: string;
  priority: number;
  unit: string;
  campaignRef: string;
  status: OptOutVarianceStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    unit: string,
    campaignRef: string,
    status: OptOutVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.unit = unit;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: OptOutVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: OptOutVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out variance"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): OptOutVariance {
    return new OptOutVariance(this.code, this.name, this.priority, this.unit, this.campaignRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a opt out variance in status idle. */
export function newOptOutVariance(code: string, name: string): OptOutVariance {
  return new OptOutVariance(code, name, 0, "", "", "idle");
}
