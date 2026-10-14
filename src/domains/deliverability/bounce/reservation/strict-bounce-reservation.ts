/**
 * The strict bounce reservation records of deliverability's bounce work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict bounce reservation is in its life cycle. */
export type StrictBounceReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a strict bounce reservation and its current status. */
export class StrictBounceReservation {
  code: string;
  label: string;
  title: string;
  cost: number;
  channel: string;
  status: StrictBounceReservationStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    cost: number,
    channel: string,
    status: StrictBounceReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.cost = cost;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBounceReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictBounceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bounce reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict bounce reservation"} ${this.code}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): StrictBounceReservation {
    return new StrictBounceReservation(this.code, this.label, this.title, this.cost, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict bounce reservation in status idle. */
export function newStrictBounceReservation(code: string, label: string): StrictBounceReservation {
  return new StrictBounceReservation(code, label, "", 0, "", "idle");
}
