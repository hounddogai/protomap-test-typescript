import * as text from "../../../../kit/text.js";

/** Where a strict touchpoint baseline is in its life cycle. */
export type StrictTouchpointBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict touchpoint baseline. Its code is unique within a tenant. */
export class StrictTouchpointBaseline {
  code: string;
  name: string;
  externalRef: string;
  label: string;
  startsAt: number;
  cohort: string;
  rate: number;
  status: StrictTouchpointBaselineStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    label: string,
    startsAt: number,
    cohort: string,
    rate: number,
    status: StrictTouchpointBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.label = label;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.rate = rate;
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

  canMoveTo(next: StrictTouchpointBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictTouchpointBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict touchpoint baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict touchpoint baseline"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.startsAt + this.rate) * 100) / 100;
  }

  copy(): StrictTouchpointBaseline {
    return new StrictTouchpointBaseline(
      this.code,
      this.name,
      this.externalRef,
      this.label,
      this.startsAt,
      this.cohort,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict touchpoint baseline in status planned. */
export function newStrictTouchpointBaseline(code: string, name: string): StrictTouchpointBaseline {
  return new StrictTouchpointBaseline(code, name, "", "", 0, "", 0, "planned");
}
