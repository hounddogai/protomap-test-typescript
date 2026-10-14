import * as text from "../../../../kit/text.js";

/** Where a global flight group is in its life cycle. */
export type GlobalFlightGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a global flight group and its current status. */
export class GlobalFlightGroup {
  code: string;
  label: string;
  clicks: number;
  frequencyCap: number;
  budget: number;
  status: GlobalFlightGroupStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    frequencyCap: number,
    budget: number,
    status: GlobalFlightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
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

  canMoveTo(next: GlobalFlightGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
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

  moveTo(next: GlobalFlightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round(this.budget * this.clicks * 100) / 100;
  }

  copy(): GlobalFlightGroup {
    return new GlobalFlightGroup(this.code, this.label, this.clicks, this.frequencyCap, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global flight group in status requested. */
export function newGlobalFlightGroup(code: string, label: string): GlobalFlightGroup {
  return new GlobalFlightGroup(code, label, 0, 0, 0, "requested");
}
