/**
 * The capped preference assignment records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped preference assignment is in its life cycle. */
export type CappedPreferenceAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A capped preference assignment. Its code is unique within a tenant. */
export class CappedPreferenceAssignment {
  code: string;
  label: string;
  source: string;
  journeyId: string;
  ratio: number;
  status: CappedPreferenceAssignmentStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    journeyId: string,
    ratio: number,
    status: CappedPreferenceAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.journeyId = journeyId;
    this.ratio = ratio;
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

  canMoveTo(next: CappedPreferenceAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedPreferenceAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped preference assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): CappedPreferenceAssignment {
    return new CappedPreferenceAssignment(this.code, this.label, this.source, this.journeyId, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped preference assignment in status created. */
export function newCappedPreferenceAssignment(code: string, label: string): CappedPreferenceAssignment {
  return new CappedPreferenceAssignment(code, label, "", "", 0, "created");
}
