import * as text from "../../../../kit/text.js";

/** Where a scheduled credit rollup is in its life cycle. */
export type ScheduledCreditRollupStatus = "created" | "validated" | "published" | "retired";

/** One scheduled credit rollup, with what the planners need to act on it. */
export class ScheduledCreditRollup {
  code: string;
  title: string;
  frequencyCap: number;
  quantity: number;
  impressions: number;
  status: ScheduledCreditRollupStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    quantity: number,
    impressions: number,
    status: ScheduledCreditRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.impressions = impressions;
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

  canMoveTo(next: ScheduledCreditRollupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledCreditRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled credit rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled credit rollup"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.impressions * this.quantity * 100) / 100;
  }

  copy(): ScheduledCreditRollup {
    return new ScheduledCreditRollup(
      this.code,
      this.title,
      this.frequencyCap,
      this.quantity,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled credit rollup in status created. */
export function newScheduledCreditRollup(code: string, title: string): ScheduledCreditRollup {
  return new ScheduledCreditRollup(code, title, 0, 0, 0, "created");
}
