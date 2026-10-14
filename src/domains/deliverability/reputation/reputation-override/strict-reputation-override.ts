/**
 * The strict reputation override records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reputation override is in its life cycle. */
export type StrictReputationOverrideStatus = "created" | "validated" | "published" | "retired";

/** One strict reputation override, with what the planners need to act on it. */
export class StrictReputationOverride {
  code: string;
  label: string;
  score: number;
  endsAt: number;
  weight: number;
  active: boolean;
  status: StrictReputationOverrideStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    endsAt: number,
    weight: number,
    active: boolean,
    status: StrictReputationOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.endsAt = endsAt;
    this.weight = weight;
    this.active = active;
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

  canMoveTo(next: StrictReputationOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictReputationOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reputation override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict reputation override"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.weight * this.endsAt * 100) / 100;
  }

  copy(): StrictReputationOverride {
    return new StrictReputationOverride(
      this.code,
      this.label,
      this.score,
      this.endsAt,
      this.weight,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict reputation override in status created. */
export function newStrictReputationOverride(code: string, label: string): StrictReputationOverride {
  return new StrictReputationOverride(code, label, 0, 0, 0, false, "created");
}
