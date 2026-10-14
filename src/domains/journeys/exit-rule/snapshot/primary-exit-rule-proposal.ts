import * as text from "../../../../kit/text.js";

/** Where a primary exit rule proposal is in its life cycle. */
export type PrimaryExitRuleProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary exit rule proposal. Its code is unique within a tenant. */
export class PrimaryExitRuleProposal {
  code: string;
  name: string;
  title: string;
  externalRef: string;
  attempts: number;
  ownerId: string;
  cohort: string;
  expiresAt: number;
  maximum: number;
  status: PrimaryExitRuleProposalStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    externalRef: string,
    attempts: number,
    ownerId: string,
    cohort: string,
    expiresAt: number,
    maximum: number,
    status: PrimaryExitRuleProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.maximum = maximum;
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

  canMoveTo(next: PrimaryExitRuleProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: PrimaryExitRuleProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary exit rule proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.attempts - this.maximum) * 100) / 100;
  }

  copy(): PrimaryExitRuleProposal {
    return new PrimaryExitRuleProposal(
      this.code,
      this.name,
      this.title,
      this.externalRef,
      this.attempts,
      this.ownerId,
      this.cohort,
      this.expiresAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary exit rule proposal in status planned. */
export function newPrimaryExitRuleProposal(code: string, name: string): PrimaryExitRuleProposal {
  return new PrimaryExitRuleProposal(code, name, "", "", 0, "", "", 0, 0, "planned");
}
