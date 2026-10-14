import * as text from "../../../../kit/text.js";

/** Where a path cycle is in its life cycle. */
export type PathCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A path cycle. Its code is unique within a tenant. */
export class PathCycle {
  code: string;
  name: string;
  approved: boolean;
  summary: string;
  channel: string;
  amount: number;
  status: PathCycleStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    summary: string,
    channel: string,
    amount: number,
    status: PathCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.summary = summary;
    this.channel = channel;
    this.amount = amount;
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

  canMoveTo(next: PathCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PathCycle {
    return new PathCycle(this.code, this.name, this.approved, this.summary, this.channel, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a path cycle in status planned. */
export function newPathCycle(code: string, name: string): PathCycle {
  return new PathCycle(code, name, false, "", "", 0, "planned");
}
