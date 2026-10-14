import * as text from "../../../../kit/text.js";

/** Where a level budget is in its life cycle. */
export type LevelBudgetStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A level budget as the level team keeps it. */
export class LevelBudget {
  code: string;
  title: string;
  externalRef: string;
  visible: boolean;
  journeyId: string;
  cohort: string;
  priority: number;
  status: LevelBudgetStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    visible: boolean,
    journeyId: string,
    cohort: string,
    priority: number,
    status: LevelBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.visible = visible;
    this.journeyId = journeyId;
    this.cohort = cohort;
    this.priority = priority;
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

  canMoveTo(next: LevelBudgetStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LevelBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"level budget"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): LevelBudget {
    return new LevelBudget(
      this.code,
      this.title,
      this.externalRef,
      this.visible,
      this.journeyId,
      this.cohort,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a level budget in status open. */
export function newLevelBudget(code: string, title: string): LevelBudget {
  return new LevelBudget(code, title, "", false, "", "", 0, "open");
}
