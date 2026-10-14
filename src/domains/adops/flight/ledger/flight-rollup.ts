import * as text from "../../../../kit/text.js";

/** Where a flight rollup is in its life cycle. */
export type FlightRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One flight rollup, with what the planners need to act on it. */
export class FlightRollup {
  code: string;
  label: string;
  bid: number;
  expiresAt: number;
  active: boolean;
  ratio: number;
  currency: string;
  externalRef: string;
  campaignRef: string;
  locale: string;
  status: FlightRollupStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    expiresAt: number,
    active: boolean,
    ratio: number,
    currency: string,
    externalRef: string,
    campaignRef: string,
    locale: string,
    status: FlightRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.expiresAt = expiresAt;
    this.active = active;
    this.ratio = ratio;
    this.currency = currency;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FlightRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"flight rollup"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.expiresAt * this.bid * 100) / 100;
  }

  copy(): FlightRollup {
    return new FlightRollup(
      this.code,
      this.label,
      this.bid,
      this.expiresAt,
      this.active,
      this.ratio,
      this.currency,
      this.externalRef,
      this.campaignRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a flight rollup in status draft. */
export function newFlightRollup(code: string, label: string): FlightRollup {
  return new FlightRollup(code, label, 0, 0, false, 0, "", "", "", "", "draft");
}
