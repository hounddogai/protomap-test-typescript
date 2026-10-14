import * as text from "../../../../kit/text.js";

/** Where a challenge cycle is in its life cycle. */
export type ChallengeCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A challenge cycle. Its code is unique within a tenant. */
export class ChallengeCycle {
  code: string;
  name: string;
  notes: string;
  floorValue: number;
  description: string;
  status: ChallengeCycleStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    floorValue: number,
    description: string,
    status: ChallengeCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.floorValue = floorValue;
    this.description = description;
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

  canMoveTo(next: ChallengeCycleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ChallengeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): ChallengeCycle {
    return new ChallengeCycle(this.code, this.name, this.notes, this.floorValue, this.description, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a challenge cycle in status open. */
export function newChallengeCycle(code: string, name: string): ChallengeCycle {
  return new ChallengeCycle(code, name, "", 0, "", "open");
}
