/**
 * The retention cycle records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention cycle is in its life cycle. */
export type RetentionCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A retention cycle as the retention team keeps it. */
export class RetentionCycle {
  code: string;
  name: string;
  ceiling: number;
  contactEmail: string;
  cost: number;
  ratio: number;
  summary: string;
  status: RetentionCycleStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    contactEmail: string,
    cost: number,
    ratio: number,
    summary: string,
    status: RetentionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.ratio = ratio;
    this.summary = summary;
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

  canMoveTo(next: RetentionCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RetentionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"retention cycle"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.ceiling * this.ratio * 100) / 100;
  }

  copy(): RetentionCycle {
    return new RetentionCycle(
      this.code,
      this.name,
      this.ceiling,
      this.contactEmail,
      this.cost,
      this.ratio,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention cycle in status requested. */
export function newRetentionCycle(code: string, name: string): RetentionCycle {
  return new RetentionCycle(code, name, 0, "", 0, 0, "", "requested");
}
