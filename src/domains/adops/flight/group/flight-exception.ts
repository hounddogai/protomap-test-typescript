import * as text from "../../../../kit/text.js";

/** Where a flight exception is in its life cycle. */
export type FlightExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight exception. Its code is unique within a tenant. */
export class FlightException {
  code: string;
  title: string;
  variant: string;
  amount: number;
  retries: number;
  locale: string;
  attributes: Map<string, string>;
  impressions: number;
  status: FlightExceptionStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    amount: number,
    retries: number,
    locale: string,
    attributes: Map<string, string>,
    impressions: number,
    status: FlightExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.amount = amount;
    this.retries = retries;
    this.locale = locale;
    this.attributes = attributes;
    this.impressions = impressions;
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

  canMoveTo(next: FlightExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"flight exception"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.amount + this.impressions) * 100) / 100;
  }

  copy(): FlightException {
    return new FlightException(
      this.code,
      this.title,
      this.variant,
      this.amount,
      this.retries,
      this.locale,
      this.attributes,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight exception in status proposed. */
export function newFlightException(code: string, title: string): FlightException {
  return new FlightException(code, title, "", 0, 0, "", new Map<string, string>(), 0, "proposed");
}
