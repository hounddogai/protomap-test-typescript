import * as text from "../../../../kit/text.js";

/** Where a flight rule is in its life cycle. */
export type FlightRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One flight rule, with what the planners need to act on it. */
export class FlightRule {
  code: string;
  name: string;
  discount: number;
  summary: string;
  limit: number;
  attempts: number;
  status: FlightRuleStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    summary: string,
    limit: number,
    attempts: number,
    status: FlightRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.summary = summary;
    this.limit = limit;
    this.attempts = attempts;
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

  canMoveTo(next: FlightRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FlightRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedTotal(): number {
    return Math.round(this.attempts * this.discount * 100) / 100;
  }

  copy(): FlightRule {
    return new FlightRule(this.code, this.name, this.discount, this.summary, this.limit, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a flight rule in status idle. */
export function newFlightRule(code: string, name: string): FlightRule {
  return new FlightRule(code, name, 0, "", 0, 0, "idle");
}
