import * as text from "../../../../kit/text.js";

/** Where a escalation tier is in its life cycle. */
export type EscalationTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One escalation tier, with what the planners need to act on it. */
export class EscalationTier {
  code: string;
  name: string;
  budget: number;
  visible: boolean;
  approved: boolean;
  journeyId: string;
  amount: number;
  reviewer: string;
  audienceId: string;
  description: string;
  revision: number;
  status: EscalationTierStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    visible: boolean,
    approved: boolean,
    journeyId: string,
    amount: number,
    reviewer: string,
    audienceId: string,
    description: string,
    revision: number,
    status: EscalationTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.visible = visible;
    this.approved = approved;
    this.journeyId = journeyId;
    this.amount = amount;
    this.reviewer = reviewer;
    this.audienceId = audienceId;
    this.description = description;
    this.revision = revision;
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

  canMoveTo(next: EscalationTierStatus): boolean {
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
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: EscalationTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.budget + this.amount) * 100) / 100;
  }

  copy(): EscalationTier {
    return new EscalationTier(
      this.code,
      this.name,
      this.budget,
      this.visible,
      this.approved,
      this.journeyId,
      this.amount,
      this.reviewer,
      this.audienceId,
      this.description,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation tier in status open. */
export function newEscalationTier(code: string, name: string): EscalationTier {
  return new EscalationTier(code, name, 0, false, false, "", 0, "", "", "", 0, "open");
}
