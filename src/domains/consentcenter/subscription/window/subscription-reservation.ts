import * as text from "../../../../kit/text.js";

/** Where a subscription reservation is in its life cycle. */
export type SubscriptionReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A subscription reservation as the subscription team keeps it. */
export class SubscriptionReservation {
  code: string;
  name: string;
  checksum: string;
  version: number;
  frequencyCap: number;
  floorValue: number;
  startsAt: number;
  archived: boolean;
  source: string;
  title: string;
  status: SubscriptionReservationStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    version: number,
    frequencyCap: number,
    floorValue: number,
    startsAt: number,
    archived: boolean,
    source: string,
    title: string,
    status: SubscriptionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.version = version;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.startsAt = startsAt;
    this.archived = archived;
    this.source = source;
    this.title = title;
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

  canMoveTo(next: SubscriptionReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.frequencyCap * this.version * 100) / 100;
  }

  copy(): SubscriptionReservation {
    return new SubscriptionReservation(
      this.code,
      this.name,
      this.checksum,
      this.version,
      this.frequencyCap,
      this.floorValue,
      this.startsAt,
      this.archived,
      this.source,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription reservation in status planned. */
export function newSubscriptionReservation(code: string, name: string): SubscriptionReservation {
  return new SubscriptionReservation(code, name, "", 0, 0, 0, 0, false, "", "", "planned");
}
