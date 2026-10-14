import * as text from "../../../../kit/text.js";

/** Where a flight bundle is in its life cycle. */
export type FlightBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A flight bundle as the flight team keeps it. */
export class FlightBundle {
  code: string;
  title: string;
  startsAt: number;
  clicks: number;
  priority: number;
  currency: string;
  campaignRef: string;
  name: string;
  ownerId: string;
  status: FlightBundleStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    clicks: number,
    priority: number,
    currency: string,
    campaignRef: string,
    name: string,
    ownerId: string,
    status: FlightBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.priority = priority;
    this.currency = currency;
    this.campaignRef = campaignRef;
    this.name = name;
    this.ownerId = ownerId;
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

  canMoveTo(next: FlightBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FlightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.priority + this.clicks) * 100) / 100;
  }

  copy(): FlightBundle {
    return new FlightBundle(
      this.code,
      this.title,
      this.startsAt,
      this.clicks,
      this.priority,
      this.currency,
      this.campaignRef,
      this.name,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight bundle in status proposed. */
export function newFlightBundle(code: string, title: string): FlightBundle {
  return new FlightBundle(code, title, 0, 0, 0, "", "", "", "", "proposed");
}
