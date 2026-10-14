/**
 * The creative assignment records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative assignment is in its life cycle. */
export type CreativeAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a creative assignment and its current status. */
export class CreativeAssignment {
  code: string;
  name: string;
  updatedAt: number;
  sendAt: number;
  variant: string;
  status: CreativeAssignmentStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    sendAt: number,
    variant: string,
    status: CreativeAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative assignment"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.sendAt + this.updatedAt) * 100) / 100;
  }

  copy(): CreativeAssignment {
    return new CreativeAssignment(this.code, this.name, this.updatedAt, this.sendAt, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative assignment in status proposed. */
export function newCreativeAssignment(code: string, name: string): CreativeAssignment {
  return new CreativeAssignment(code, name, 0, 0, "", "proposed");
}
