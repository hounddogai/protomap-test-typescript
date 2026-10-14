import * as text from "../../../../kit/text.js";

/** Where a exit rule reservation is in its life cycle. */
export type ExitRuleReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A exit rule reservation. Its code is unique within a tenant. */
export class ExitRuleReservation {
  code: string;
  name: string;
  minimum: number;
  channel: string;
  timezone: string;
  cost: number;
  impressions: number;
  variant: string;
  category: string;
  region: string;
  status: ExitRuleReservationStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    channel: string,
    timezone: string,
    cost: number,
    impressions: number,
    variant: string,
    category: string,
    region: string,
    status: ExitRuleReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.channel = channel;
    this.timezone = timezone;
    this.cost = cost;
    this.impressions = impressions;
    this.variant = variant;
    this.category = category;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ExitRuleReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.cost + this.impressions) * 100) / 100;
  }

  copy(): ExitRuleReservation {
    return new ExitRuleReservation(
      this.code,
      this.name,
      this.minimum,
      this.channel,
      this.timezone,
      this.cost,
      this.impressions,
      this.variant,
      this.category,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a exit rule reservation in status planned. */
export function newExitRuleReservation(code: string, name: string): ExitRuleReservation {
  return new ExitRuleReservation(code, name, 0, "", "", 0, 0, "", "", "", "planned");
}
