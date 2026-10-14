/**
 * The regional reputation score records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional reputation score is in its life cycle. */
export type RegionalReputationScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional reputation score and its current status. */
export class RegionalReputationScore {
  code: string;
  label: string;
  name: string;
  title: string;
  retries: number;
  status: RegionalReputationScoreStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    title: string,
    retries: number,
    status: RegionalReputationScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.title = title;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalReputationScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalReputationScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reputation score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): RegionalReputationScore {
    return new RegionalReputationScore(this.code, this.label, this.name, this.title, this.retries, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional reputation score in status draft. */
export function newRegionalReputationScore(code: string, label: string): RegionalReputationScore {
  return new RegionalReputationScore(code, label, "", "", 0, "draft");
}
