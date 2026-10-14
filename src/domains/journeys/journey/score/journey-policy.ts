import * as text from "../../../../kit/text.js";

/** Where a journey policy is in its life cycle. */
export type JourneyPolicyStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A journey policy as the journey team keeps it. */
export class JourneyPolicy {
  code: string;
  name: string;
  cohort: string;
  rate: number;
  endsAt: number;
  impressions: number;
  status: JourneyPolicyStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    rate: number,
    endsAt: number,
    impressions: number,
    status: JourneyPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.rate = rate;
    this.endsAt = endsAt;
    this.impressions = impressions;
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

  canMoveTo(next: JourneyPolicyStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: JourneyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.rate - this.impressions) * 100) / 100;
  }

  copy(): JourneyPolicy {
    return new JourneyPolicy(this.code, this.name, this.cohort, this.rate, this.endsAt, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey policy in status idle. */
export function newJourneyPolicy(code: string, name: string): JourneyPolicy {
  return new JourneyPolicy(code, name, "", 0, 0, 0, "idle");
}
