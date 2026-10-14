/**
 * The pacing window records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing window is in its life cycle. */
export type PacingWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A pacing window as the pacing team keeps it. */
export class PacingWindow {
  code: string;
  title: string;
  durationMinutes: number;
  cohort: string;
  name: string;
  notes: string;
  region: string;
  status: PacingWindowStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    cohort: string,
    name: string,
    notes: string,
    region: string,
    status: PacingWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.name = name;
    this.notes = notes;
    this.region = region;
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

  canMoveTo(next: PacingWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PacingWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): PacingWindow {
    return new PacingWindow(
      this.code,
      this.title,
      this.durationMinutes,
      this.cohort,
      this.name,
      this.notes,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing window in status requested. */
export function newPacingWindow(code: string, title: string): PacingWindow {
  return new PacingWindow(code, title, 0, "", "", "", "", "requested");
}
