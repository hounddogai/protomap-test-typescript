import * as text from "../../../../kit/text.js";

/** Where a flight reservation is in its life cycle. */
export type FlightReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a flight reservation and its current status. */
export class FlightReservation {
  code: string;
  label: string;
  name: string;
  openRate: number;
  maximum: number;
  region: string;
  createdAt: number;
  tags: string[];
  ownerId: string;
  attributes: Map<string, string>;
  channel: string;
  status: FlightReservationStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    openRate: number,
    maximum: number,
    region: string,
    createdAt: number,
    tags: string[],
    ownerId: string,
    attributes: Map<string, string>,
    channel: string,
    status: FlightReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.openRate = openRate;
    this.maximum = maximum;
    this.region = region;
    this.createdAt = createdAt;
    this.tags = tags;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.channel = channel;
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

  canMoveTo(next: FlightReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FlightReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round(this.maximum * this.createdAt * 100) / 100;
  }

  copy(): FlightReservation {
    return new FlightReservation(
      this.code,
      this.label,
      this.name,
      this.openRate,
      this.maximum,
      this.region,
      this.createdAt,
      this.tags,
      this.ownerId,
      this.attributes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a flight reservation in status requested. */
export function newFlightReservation(code: string, label: string): FlightReservation {
  return new FlightReservation(code, label, "", 0, 0, "", 0, [], "", new Map<string, string>(), "", "requested");
}
