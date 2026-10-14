import * as text from "../../../../kit/text.js";

/** Where a wait reservation is in its life cycle. */
export type WaitReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One wait reservation, with what the planners need to act on it. */
export class WaitReservation {
  code: string;
  name: string;
  floorValue: number;
  tags: string[];
  endsAt: number;
  status: WaitReservationStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    tags: string[],
    endsAt: number,
    status: WaitReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.tags = tags;
    this.endsAt = endsAt;
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

  canMoveTo(next: WaitReservationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WaitReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"wait reservation"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.endsAt - this.floorValue) * 100) / 100;
  }

  copy(): WaitReservation {
    return new WaitReservation(this.code, this.name, this.floorValue, this.tags, this.endsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait reservation in status new. */
export function newWaitReservation(code: string, name: string): WaitReservation {
  return new WaitReservation(code, name, 0, [], 0, "new");
}
