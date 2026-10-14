import * as text from "../../../../kit/text.js";

/** Where a proof assignment is in its life cycle. */
export type ProofAssignmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof assignment. Its code is unique within a tenant. */
export class ProofAssignment {
  code: string;
  title: string;
  timezone: string;
  impressions: number;
  sendAt: number;
  locale: string;
  budget: number;
  status: ProofAssignmentStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    impressions: number,
    sendAt: number,
    locale: string,
    budget: number,
    status: ProofAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.locale = locale;
    this.budget = budget;
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

  canMoveTo(next: ProofAssignmentStatus): boolean {
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
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.sendAt + this.impressions) * 100) / 100;
  }

  copy(): ProofAssignment {
    return new ProofAssignment(
      this.code,
      this.title,
      this.timezone,
      this.impressions,
      this.sendAt,
      this.locale,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a proof assignment in status open. */
export function newProofAssignment(code: string, title: string): ProofAssignment {
  return new ProofAssignment(code, title, "", 0, 0, "", 0, "open");
}
