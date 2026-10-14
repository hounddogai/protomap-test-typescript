import * as text from "../../../../kit/text.js";

/** Where a credit draft is in its life cycle. */
export type CreditDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a credit draft and its current status. */
export class CreditDraft {
  code: string;
  title: string;
  journeyId: string;
  attempts: number;
  score: number;
  status: CreditDraftStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    attempts: number,
    score: number,
    status: CreditDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.attempts = attempts;
    this.score = score;
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

  canMoveTo(next: CreditDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit draft"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.score * this.attempts * 100) / 100;
  }

  copy(): CreditDraft {
    return new CreditDraft(this.code, this.title, this.journeyId, this.attempts, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit draft in status open. */
export function newCreditDraft(code: string, title: string): CreditDraft {
  return new CreditDraft(code, title, "", 0, 0, "open");
}
