import * as text from "../../../../kit/text.js";

/** Where a regional exit rule baseline is in its life cycle. */
export type RegionalExitRuleBaselineStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional exit rule baseline as the exit rule team keeps it. */
export class RegionalExitRuleBaseline {
  code: string;
  name: string;
  minimum: number;
  graceDays: number;
  pinned: boolean;
  limit: number;
  title: string;
  visible: boolean;
  audienceId: string;
  batchSize: number;
  variant: string;
  status: RegionalExitRuleBaselineStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    graceDays: number,
    pinned: boolean,
    limit: number,
    title: string,
    visible: boolean,
    audienceId: string,
    batchSize: number,
    variant: string,
    status: RegionalExitRuleBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.pinned = pinned;
    this.limit = limit;
    this.title = title;
    this.visible = visible;
    this.audienceId = audienceId;
    this.batchSize = batchSize;
    this.variant = variant;
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

  canMoveTo(next: RegionalExitRuleBaselineStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: RegionalExitRuleBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional exit rule baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional exit rule baseline"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.batchSize + this.graceDays) * 100) / 100;
  }

  copy(): RegionalExitRuleBaseline {
    return new RegionalExitRuleBaseline(
      this.code,
      this.name,
      this.minimum,
      this.graceDays,
      this.pinned,
      this.limit,
      this.title,
      this.visible,
      this.audienceId,
      this.batchSize,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional exit rule baseline in status planned. */
export function newRegionalExitRuleBaseline(code: string, name: string): RegionalExitRuleBaseline {
  return new RegionalExitRuleBaseline(code, name, 0, 0, false, 0, "", false, "", 0, "", "planned");
}
