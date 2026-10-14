import * as text from "../../../../kit/text.js";

/** Where a flight metric is in its life cycle. */
export type FlightMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight metric. Its code is unique within a tenant. */
export class FlightMetric {
  code: string;
  name: string;
  checksum: string;
  attempts: number;
  attributes: Map<string, string>;
  campaignRef: string;
  status: FlightMetricStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    attempts: number,
    attributes: Map<string, string>,
    campaignRef: string,
    status: FlightMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.attempts = attempts;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FlightMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): FlightMetric {
    return new FlightMetric(
      this.code,
      this.name,
      this.checksum,
      this.attempts,
      this.attributes,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a flight metric in status proposed. */
export function newFlightMetric(code: string, name: string): FlightMetric {
  return new FlightMetric(code, name, "", 0, new Map<string, string>(), "", "proposed");
}
