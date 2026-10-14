import * as text from "../../../../kit/text.js";

/** Where a flight policy is in its life cycle. */
export type FlightPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** A flight policy. Its code is unique within a tenant. */
export class FlightPolicy {
  code: string;
  title: string;
  attempts: number;
  capacity: number;
  channel: string;
  budget: number;
  threshold: number;
  campaignRef: string;
  impressions: number;
  status: FlightPolicyStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    capacity: number,
    channel: string,
    budget: number,
    threshold: number,
    campaignRef: string,
    impressions: number,
    status: FlightPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.capacity = capacity;
    this.channel = channel;
    this.budget = budget;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
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

  canMoveTo(next: FlightPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedVolume(): number {
    return Math.round((this.capacity - this.impressions) * 100) / 100;
  }

  copy(): FlightPolicy {
    return new FlightPolicy(
      this.code,
      this.title,
      this.attempts,
      this.capacity,
      this.channel,
      this.budget,
      this.threshold,
      this.campaignRef,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a flight policy in status new. */
export function newFlightPolicy(code: string, title: string): FlightPolicy {
  return new FlightPolicy(code, title, 0, 0, "", 0, 0, "", 0, "new");
}
