import * as text from "../../../../kit/text.js";

/** Where a pacing rule is in its life cycle. */
export type PacingRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pacing rule as the pacing team keeps it. */
export class PacingRule {
  code: string;
  title: string;
  retries: number;
  contactEmail: string;
  sequence: number;
  pinned: boolean;
  durationMinutes: number;
  journeyId: string;
  externalRef: string;
  status: PacingRuleStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    contactEmail: string,
    sequence: number,
    pinned: boolean,
    durationMinutes: number,
    journeyId: string,
    externalRef: string,
    status: PacingRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.externalRef = externalRef;
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

  canMoveTo(next: PacingRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pacing rule"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.durationMinutes * this.retries * 100) / 100;
  }

  copy(): PacingRule {
    return new PacingRule(
      this.code,
      this.title,
      this.retries,
      this.contactEmail,
      this.sequence,
      this.pinned,
      this.durationMinutes,
      this.journeyId,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing rule in status planned. */
export function newPacingRule(code: string, title: string): PacingRule {
  return new PacingRule(code, title, 0, "", 0, false, 0, "", "", "planned");
}
