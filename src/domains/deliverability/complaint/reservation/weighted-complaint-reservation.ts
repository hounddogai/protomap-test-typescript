/**
 * The weighted complaint reservation records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted complaint reservation is in its life cycle. */
export type WeightedComplaintReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted complaint reservation and its current status. */
export class WeightedComplaintReservation {
  code: string;
  name: string;
  ownerId: string;
  channel: string;
  windowDays: number;
  frequencyCap: number;
  capacity: number;
  status: WeightedComplaintReservationStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    channel: string,
    windowDays: number,
    frequencyCap: number,
    capacity: number,
    status: WeightedComplaintReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.channel = channel;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedComplaintReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedComplaintReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted complaint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted complaint reservation"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.windowDays - this.capacity) * 100) / 100;
  }

  copy(): WeightedComplaintReservation {
    return new WeightedComplaintReservation(
      this.code,
      this.name,
      this.ownerId,
      this.channel,
      this.windowDays,
      this.frequencyCap,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted complaint reservation in status new. */
export function newWeightedComplaintReservation(code: string, name: string): WeightedComplaintReservation {
  return new WeightedComplaintReservation(code, name, "", "", 0, 0, 0, "new");
}
