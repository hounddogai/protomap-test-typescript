import * as text from "../../../../kit/text.js";

/** Where a exit rule draft is in its life cycle. */
export type ExitRuleDraftStatus = "created" | "validated" | "published" | "retired";

/** A exit rule draft as the exit rule team keeps it. */
export class ExitRuleDraft {
  code: string;
  title: string;
  locale: string;
  attempts: number;
  country: string;
  status: ExitRuleDraftStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    attempts: number,
    country: string,
    status: ExitRuleDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attempts = attempts;
    this.country = country;
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

  canMoveTo(next: ExitRuleDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ExitRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): ExitRuleDraft {
    return new ExitRuleDraft(this.code, this.title, this.locale, this.attempts, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a exit rule draft in status created. */
export function newExitRuleDraft(code: string, title: string): ExitRuleDraft {
  return new ExitRuleDraft(code, title, "", 0, "", "created");
}
