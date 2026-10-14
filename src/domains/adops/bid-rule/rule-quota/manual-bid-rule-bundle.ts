import * as text from "../../../../kit/text.js";

/** Where a manual bid rule bundle is in its life cycle. */
export type ManualBidRuleBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual bid rule bundle as the bid rule team keeps it. */
export class ManualBidRuleBundle {
  code: string;
  title: string;
  priority: number;
  cohort: string;
  startsAt: number;
  name: string;
  status: ManualBidRuleBundleStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    cohort: string,
    startsAt: number,
    name: string,
    status: ManualBidRuleBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.cohort = cohort;
    this.startsAt = startsAt;
    this.name = name;
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

  canMoveTo(next: ManualBidRuleBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualBidRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bid rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.startsAt + this.priority) * 100) / 100;
  }

  copy(): ManualBidRuleBundle {
    return new ManualBidRuleBundle(
      this.code,
      this.title,
      this.priority,
      this.cohort,
      this.startsAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual bid rule bundle in status new. */
export function newManualBidRuleBundle(code: string, title: string): ManualBidRuleBundle {
  return new ManualBidRuleBundle(code, title, 0, "", 0, "", "new");
}
