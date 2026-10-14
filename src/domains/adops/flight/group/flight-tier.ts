import * as text from "../../../../kit/text.js";

/** Where a flight tier is in its life cycle. */
export type FlightTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A flight tier as the flight team keeps it. */
export class FlightTier {
  code: string;
  name: string;
  cost: number;
  priority: number;
  budget: number;
  audienceId: string;
  sendAt: number;
  label: string;
  revision: number;
  currency: string;
  status: FlightTierStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    priority: number,
    budget: number,
    audienceId: string,
    sendAt: number,
    label: string,
    revision: number,
    currency: string,
    status: FlightTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.priority = priority;
    this.budget = budget;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.label = label;
    this.revision = revision;
    this.currency = currency;
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

  canMoveTo(next: FlightTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
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

  moveTo(next: FlightTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.revision + this.cost) * 100) / 100;
  }

  copy(): FlightTier {
    return new FlightTier(
      this.code,
      this.name,
      this.cost,
      this.priority,
      this.budget,
      this.audienceId,
      this.sendAt,
      this.label,
      this.revision,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a flight tier in status idle. */
export function newFlightTier(code: string, name: string): FlightTier {
  return new FlightTier(code, name, 0, 0, 0, "", 0, "", 0, "", "idle");
}
