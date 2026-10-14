/**
 * The flight snapshot records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight snapshot is in its life cycle. */
export type FlightSnapshotStatus = "created" | "validated" | "published" | "retired";

/** A flight snapshot. Its code is unique within a tenant. */
export class FlightSnapshot {
  code: string;
  name: string;
  externalRef: string;
  version: number;
  endsAt: number;
  category: string;
  attempts: number;
  channel: string;
  archived: boolean;
  discount: number;
  status: FlightSnapshotStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    version: number,
    endsAt: number,
    category: string,
    attempts: number,
    channel: string,
    archived: boolean,
    discount: number,
    status: FlightSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.version = version;
    this.endsAt = endsAt;
    this.category = category;
    this.attempts = attempts;
    this.channel = channel;
    this.archived = archived;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round((this.attempts + this.version) * 100) / 100;
  }

  copy(): FlightSnapshot {
    return new FlightSnapshot(
      this.code,
      this.name,
      this.externalRef,
      this.version,
      this.endsAt,
      this.category,
      this.attempts,
      this.channel,
      this.archived,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a flight snapshot in status created. */
export function newFlightSnapshot(code: string, name: string): FlightSnapshot {
  return new FlightSnapshot(code, name, "", 0, 0, "", 0, "", false, 0, "created");
}
