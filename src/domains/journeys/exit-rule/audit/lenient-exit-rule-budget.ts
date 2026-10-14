import * as text from "../../../../kit/text.js";

/** Where a lenient exit rule budget is in its life cycle. */
export type LenientExitRuleBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient exit rule budget as the exit rule team keeps it. */
export class LenientExitRuleBudget {
  code: string;
  name: string;
  floorValue: number;
  audienceId: string;
  durationMinutes: number;
  windowDays: number;
  ratio: number;
  locale: string;
  pinned: boolean;
  status: LenientExitRuleBudgetStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    audienceId: string,
    durationMinutes: number,
    windowDays: number,
    ratio: number,
    locale: string,
    pinned: boolean,
    status: LenientExitRuleBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.locale = locale;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientExitRuleBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientExitRuleBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient exit rule budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.ratio + this.durationMinutes) * 100) / 100;
  }

  copy(): LenientExitRuleBudget {
    return new LenientExitRuleBudget(
      this.code,
      this.name,
      this.floorValue,
      this.audienceId,
      this.durationMinutes,
      this.windowDays,
      this.ratio,
      this.locale,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient exit rule budget in status new. */
export function newLenientExitRuleBudget(code: string, name: string): LenientExitRuleBudget {
  return new LenientExitRuleBudget(code, name, 0, "", 0, 0, 0, "", false, "new");
}
