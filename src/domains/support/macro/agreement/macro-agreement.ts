/**
 * The macro agreement records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro agreement is in its life cycle. */
export type MacroAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A macro agreement as the macro team keeps it. */
export class MacroAgreement {
  code: string;
  title: string;
  notes: string;
  archived: boolean;
  limit: number;
  locale: string;
  currency: string;
  status: MacroAgreementStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    archived: boolean,
    limit: number,
    locale: string,
    currency: string,
    status: MacroAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.archived = archived;
    this.limit = limit;
    this.locale = locale;
    this.currency = currency;
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

  canMoveTo(next: MacroAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): MacroAgreement {
    return new MacroAgreement(
      this.code,
      this.title,
      this.notes,
      this.archived,
      this.limit,
      this.locale,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a macro agreement in status planned. */
export function newMacroAgreement(code: string, title: string): MacroAgreement {
  return new MacroAgreement(code, title, "", false, 0, "", "", "planned");
}
