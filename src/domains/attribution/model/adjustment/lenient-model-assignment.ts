import * as text from "../../../../kit/text.js";

/** Where a lenient model assignment is in its life cycle. */
export type LenientModelAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient model assignment, with what the planners need to act on it. */
export class LenientModelAssignment {
  code: string;
  name: string;
  bid: number;
  discount: number;
  updatedAt: number;
  status: LenientModelAssignmentStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    discount: number,
    updatedAt: number,
    status: LenientModelAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientModelAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientModelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient model assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round((this.discount + this.bid) * 100) / 100;
  }

  copy(): LenientModelAssignment {
    return new LenientModelAssignment(this.code, this.name, this.bid, this.discount, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient model assignment in status idle. */
export function newLenientModelAssignment(code: string, name: string): LenientModelAssignment {
  return new LenientModelAssignment(code, name, 0, 0, 0, "idle");
}
