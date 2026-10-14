import * as text from "../../../../kit/text.js";

/** Where a adaptive ticket view assignment is in its life cycle. */
export type AdaptiveTicketViewAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive ticket view assignment. Its code is unique within a tenant. */
export class AdaptiveTicketViewAssignment {
  code: string;
  name: string;
  reviewer: string;
  description: string;
  attributes: Map<string, string>;
  amount: number;
  status: AdaptiveTicketViewAssignmentStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    description: string,
    attributes: Map<string, string>,
    amount: number,
    status: AdaptiveTicketViewAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.description = description;
    this.attributes = attributes;
    this.amount = amount;
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

  canMoveTo(next: AdaptiveTicketViewAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: AdaptiveTicketViewAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive ticket view assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): AdaptiveTicketViewAssignment {
    return new AdaptiveTicketViewAssignment(
      this.code,
      this.name,
      this.reviewer,
      this.description,
      this.attributes,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive ticket view assignment in status idle. */
export function newAdaptiveTicketViewAssignment(code: string, name: string): AdaptiveTicketViewAssignment {
  return new AdaptiveTicketViewAssignment(code, name, "", "", new Map<string, string>(), 0, "idle");
}
