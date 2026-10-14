import * as text from "../../../../kit/text.js";

/** Where a window assignment is in its life cycle. */
export type WindowAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a window assignment and its current status. */
export class WindowAssignment {
  code: string;
  name: string;
  limit: number;
  channel: string;
  notes: string;
  sequence: number;
  budget: number;
  summary: string;
  score: number;
  currency: string;
  status: WindowAssignmentStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    channel: string,
    notes: string,
    sequence: number,
    budget: number,
    summary: string,
    score: number,
    currency: string,
    status: WindowAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.channel = channel;
    this.notes = notes;
    this.sequence = sequence;
    this.budget = budget;
    this.summary = summary;
    this.score = score;
    this.currency = currency;
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

  canMoveTo(next: WindowAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WindowAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.limit - this.sequence) * 100) / 100;
  }

  copy(): WindowAssignment {
    return new WindowAssignment(
      this.code,
      this.name,
      this.limit,
      this.channel,
      this.notes,
      this.sequence,
      this.budget,
      this.summary,
      this.score,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a window assignment in status requested. */
export function newWindowAssignment(code: string, name: string): WindowAssignment {
  return new WindowAssignment(code, name, 0, "", "", 0, 0, "", 0, "", "requested");
}
