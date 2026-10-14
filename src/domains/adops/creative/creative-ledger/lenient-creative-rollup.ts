import * as text from "../../../../kit/text.js";

/** Where a lenient creative rollup is in its life cycle. */
export type LenientCreativeRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient creative rollup as the creative team keeps it. */
export class LenientCreativeRollup {
  code: string;
  title: string;
  retries: number;
  margin: number;
  archived: boolean;
  attempts: number;
  budget: number;
  status: LenientCreativeRollupStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    margin: number,
    archived: boolean,
    attempts: number,
    budget: number,
    status: LenientCreativeRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.margin = margin;
    this.archived = archived;
    this.attempts = attempts;
    this.budget = budget;
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

  canMoveTo(next: LenientCreativeRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientCreativeRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient creative rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient creative rollup"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.attempts + this.budget) * 100) / 100;
  }

  copy(): LenientCreativeRollup {
    return new LenientCreativeRollup(
      this.code,
      this.title,
      this.retries,
      this.margin,
      this.archived,
      this.attempts,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient creative rollup in status new. */
export function newLenientCreativeRollup(code: string, title: string): LenientCreativeRollup {
  return new LenientCreativeRollup(code, title, 0, 0, false, 0, 0, "new");
}
