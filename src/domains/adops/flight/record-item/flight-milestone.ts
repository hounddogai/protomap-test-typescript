import * as text from "../../../../kit/text.js";

/** Where a flight milestone is in its life cycle. */
export type FlightMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight milestone. Its code is unique within a tenant. */
export class FlightMilestone {
  code: string;
  title: string;
  conversionRate: number;
  externalRef: string;
  ratio: number;
  attributes: Map<string, string>;
  variant: string;
  status: FlightMilestoneStatus;

  constructor(
    code: string,
    title: string,
    conversionRate: number,
    externalRef: string,
    ratio: number,
    attributes: Map<string, string>,
    variant: string,
    status: FlightMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.attributes = attributes;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round(this.ratio * this.conversionRate * 100) / 100;
  }

  copy(): FlightMilestone {
    return new FlightMilestone(
      this.code,
      this.title,
      this.conversionRate,
      this.externalRef,
      this.ratio,
      this.attributes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight milestone in status proposed. */
export function newFlightMilestone(code: string, title: string): FlightMilestone {
  return new FlightMilestone(code, title, 0, "", 0, new Map<string, string>(), "", "proposed");
}
