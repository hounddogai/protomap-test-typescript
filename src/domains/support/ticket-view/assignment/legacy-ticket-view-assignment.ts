/**
 * The legacy ticket view assignment records of support's ticket view work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view assignment is in its life cycle. */
export type LegacyTicketViewAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One legacy ticket view assignment, with what the planners need to act on it. */
export class LegacyTicketViewAssignment {
  code: string;
  name: string;
  label: string;
  revision: number;
  margin: number;
  sequence: number;
  rate: number;
  pinned: boolean;
  category: string;
  source: string;
  status: LegacyTicketViewAssignmentStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    revision: number,
    margin: number,
    sequence: number,
    rate: number,
    pinned: boolean,
    category: string,
    source: string,
    status: LegacyTicketViewAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.revision = revision;
    this.margin = margin;
    this.sequence = sequence;
    this.rate = rate;
    this.pinned = pinned;
    this.category = category;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTicketViewAssignmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyTicketViewAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.revision + this.margin) * 100) / 100;
  }

  copy(): LegacyTicketViewAssignment {
    return new LegacyTicketViewAssignment(
      this.code,
      this.name,
      this.label,
      this.revision,
      this.margin,
      this.sequence,
      this.rate,
      this.pinned,
      this.category,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy ticket view assignment in status open. */
export function newLegacyTicketViewAssignment(code: string, name: string): LegacyTicketViewAssignment {
  return new LegacyTicketViewAssignment(code, name, "", 0, 0, 0, 0, false, "", "", "open");
}
