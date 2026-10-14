/**
 * The legacy challenge draft records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy challenge draft is in its life cycle. */
export type LegacyChallengeDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A legacy challenge draft. Its code is unique within a tenant. */
export class LegacyChallengeDraft {
  code: string;
  name: string;
  notes: string;
  contactEmail: string;
  cost: number;
  status: LegacyChallengeDraftStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    contactEmail: string,
    cost: number,
    status: LegacyChallengeDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.contactEmail = contactEmail;
    this.cost = cost;
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

  canMoveTo(next: LegacyChallengeDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyChallengeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy challenge draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): LegacyChallengeDraft {
    return new LegacyChallengeDraft(this.code, this.name, this.notes, this.contactEmail, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy challenge draft in status planned. */
export function newLegacyChallengeDraft(code: string, name: string): LegacyChallengeDraft {
  return new LegacyChallengeDraft(code, name, "", "", 0, "planned");
}
