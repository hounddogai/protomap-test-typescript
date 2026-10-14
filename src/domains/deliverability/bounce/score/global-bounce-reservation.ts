import * as text from "../../../../kit/text.js";

/** Where a global bounce reservation is in its life cycle. */
export type GlobalBounceReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** One global bounce reservation, with what the planners need to act on it. */
export class GlobalBounceReservation {
  code: string;
  label: string;
  summary: string;
  floorValue: number;
  budget: number;
  limit: number;
  margin: number;
  archived: boolean;
  status: GlobalBounceReservationStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    floorValue: number,
    budget: number,
    limit: number,
    margin: number,
    archived: boolean,
    status: GlobalBounceReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.floorValue = floorValue;
    this.budget = budget;
    this.limit = limit;
    this.margin = margin;
    this.archived = archived;
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

  canMoveTo(next: GlobalBounceReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: GlobalBounceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global bounce reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"global bounce reservation"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.budget - this.floorValue) * 100) / 100;
  }

  copy(): GlobalBounceReservation {
    return new GlobalBounceReservation(
      this.code,
      this.label,
      this.summary,
      this.floorValue,
      this.budget,
      this.limit,
      this.margin,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global bounce reservation in status new. */
export function newGlobalBounceReservation(code: string, label: string): GlobalBounceReservation {
  return new GlobalBounceReservation(code, label, "", 0, 0, 0, 0, false, "new");
}
