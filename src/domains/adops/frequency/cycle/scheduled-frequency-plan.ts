import * as text from "../../../../kit/text.js";

/** Where a scheduled frequency plan is in its life cycle. */
export type ScheduledFrequencyPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled frequency plan and its current status. */
export class ScheduledFrequencyPlan {
  code: string;
  title: string;
  approved: boolean;
  segment: string;
  attributes: Map<string, string>;
  pinned: boolean;
  ratio: number;
  weight: number;
  name: string;
  status: ScheduledFrequencyPlanStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    segment: string,
    attributes: Map<string, string>,
    pinned: boolean,
    ratio: number,
    weight: number,
    name: string,
    status: ScheduledFrequencyPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.segment = segment;
    this.attributes = attributes;
    this.pinned = pinned;
    this.ratio = ratio;
    this.weight = weight;
    this.name = name;
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

  canMoveTo(next: ScheduledFrequencyPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFrequencyPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled frequency plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled frequency plan"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.weight - this.ratio) * 100) / 100;
  }

  copy(): ScheduledFrequencyPlan {
    return new ScheduledFrequencyPlan(
      this.code,
      this.title,
      this.approved,
      this.segment,
      this.attributes,
      this.pinned,
      this.ratio,
      this.weight,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled frequency plan in status open. */
export function newScheduledFrequencyPlan(code: string, title: string): ScheduledFrequencyPlan {
  return new ScheduledFrequencyPlan(code, title, false, "", new Map<string, string>(), false, 0, 0, "", "open");
}
