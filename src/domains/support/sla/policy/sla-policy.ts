/**
 * The sla policy records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla policy is in its life cycle. */
export type SlaPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One sla policy, with what the planners need to act on it. */
export class SlaPolicy {
  code: string;
  name: string;
  description: string;
  locale: string;
  attempts: number;
  status: SlaPolicyStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    locale: string,
    attempts: number,
    status: SlaPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.locale = locale;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SlaPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): SlaPolicy {
    return new SlaPolicy(this.code, this.name, this.description, this.locale, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a sla policy in status draft. */
export function newSlaPolicy(code: string, name: string): SlaPolicy {
  return new SlaPolicy(code, name, "", "", 0, "draft");
}
