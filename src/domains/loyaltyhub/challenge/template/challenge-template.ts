/**
 * The challenge template records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge template is in its life cycle. */
export type ChallengeTemplateStatus = "created" | "validated" | "published" | "retired";

/** A challenge template. Its code is unique within a tenant. */
export class ChallengeTemplate {
  code: string;
  label: string;
  source: string;
  category: string;
  audienceId: string;
  amount: number;
  status: ChallengeTemplateStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    category: string,
    audienceId: string,
    amount: number,
    status: ChallengeTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.category = category;
    this.audienceId = audienceId;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ChallengeTemplate {
    return new ChallengeTemplate(
      this.code,
      this.label,
      this.source,
      this.category,
      this.audienceId,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a challenge template in status created. */
export function newChallengeTemplate(code: string, label: string): ChallengeTemplate {
  return new ChallengeTemplate(code, label, "", "", "", 0, "created");
}
