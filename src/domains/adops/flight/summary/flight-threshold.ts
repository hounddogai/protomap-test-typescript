import * as text from "../../../../kit/text.js";

/** Where a flight threshold is in its life cycle. */
export type FlightThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One flight threshold, with what the planners need to act on it. */
export class FlightThreshold {
  code: string;
  name: string;
  ratio: number;
  quantity: number;
  campaignRef: string;
  expiresAt: number;
  source: string;
  conversionRate: number;
  sequence: number;
  status: FlightThresholdStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    quantity: number,
    campaignRef: string,
    expiresAt: number,
    source: string,
    conversionRate: number,
    sequence: number,
    status: FlightThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.source = source;
    this.conversionRate = conversionRate;
    this.sequence = sequence;
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

  canMoveTo(next: FlightThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FlightThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round(this.ratio * this.quantity * 100) / 100;
  }

  copy(): FlightThreshold {
    return new FlightThreshold(
      this.code,
      this.name,
      this.ratio,
      this.quantity,
      this.campaignRef,
      this.expiresAt,
      this.source,
      this.conversionRate,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a flight threshold in status requested. */
export function newFlightThreshold(code: string, name: string): FlightThreshold {
  return new FlightThreshold(code, name, 0, 0, "", 0, "", 0, 0, "requested");
}
