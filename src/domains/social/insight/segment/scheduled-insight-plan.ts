import * as text from "../../../../kit/text.js";

/** Where a scheduled insight plan is in its life cycle. */
export type ScheduledInsightPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled insight plan. Its code is unique within a tenant. */
export class ScheduledInsightPlan {
  code: string;
  label: string;
  sequence: number;
  journeyId: string;
  tags: string[];
  status: ScheduledInsightPlanStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    journeyId: string,
    tags: string[],
    status: ScheduledInsightPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.journeyId = journeyId;
    this.tags = tags;
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

  canMoveTo(next: ScheduledInsightPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledInsightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled insight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): ScheduledInsightPlan {
    return new ScheduledInsightPlan(this.code, this.label, this.sequence, this.journeyId, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled insight plan in status new. */
export function newScheduledInsightPlan(code: string, label: string): ScheduledInsightPlan {
  return new ScheduledInsightPlan(code, label, 0, "", [], "new");
}
