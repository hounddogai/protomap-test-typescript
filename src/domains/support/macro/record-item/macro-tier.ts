import * as text from "../../../../kit/text.js";

/** Where a macro tier is in its life cycle. */
export type MacroTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a macro tier and its current status. */
export class MacroTier {
  code: string;
  title: string;
  summary: string;
  discount: number;
  pinned: boolean;
  journeyId: string;
  frequencyCap: number;
  budget: number;
  archived: boolean;
  graceDays: number;
  status: MacroTierStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    discount: number,
    pinned: boolean,
    journeyId: string,
    frequencyCap: number,
    budget: number,
    archived: boolean,
    graceDays: number,
    status: MacroTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.discount = discount;
    this.pinned = pinned;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.archived = archived;
    this.graceDays = graceDays;
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

  canMoveTo(next: MacroTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.frequencyCap + this.discount) * 100) / 100;
  }

  copy(): MacroTier {
    return new MacroTier(
      this.code,
      this.title,
      this.summary,
      this.discount,
      this.pinned,
      this.journeyId,
      this.frequencyCap,
      this.budget,
      this.archived,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro tier in status created. */
export function newMacroTier(code: string, title: string): MacroTier {
  return new MacroTier(code, title, "", 0, false, "", 0, 0, false, 0, "created");
}
