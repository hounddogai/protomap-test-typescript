import * as text from "../../../../kit/text.js";

/** Where a primary path draft is in its life cycle. */
export type PrimaryPathDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a primary path draft and its current status. */
export class PrimaryPathDraft {
  code: string;
  title: string;
  cohort: string;
  expiresAt: number;
  locale: string;
  conversionRate: number;
  status: PrimaryPathDraftStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    expiresAt: number,
    locale: string,
    conversionRate: number,
    status: PrimaryPathDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryPathDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPathDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary path draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round(this.expiresAt * this.conversionRate * 100) / 100;
  }

  copy(): PrimaryPathDraft {
    return new PrimaryPathDraft(
      this.code,
      this.title,
      this.cohort,
      this.expiresAt,
      this.locale,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary path draft in status proposed. */
export function newPrimaryPathDraft(code: string, title: string): PrimaryPathDraft {
  return new PrimaryPathDraft(code, title, "", 0, "", 0, "proposed");
}
