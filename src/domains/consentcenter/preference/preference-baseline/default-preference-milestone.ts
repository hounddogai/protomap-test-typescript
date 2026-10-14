import * as text from "../../../../kit/text.js";

/** Where a default preference milestone is in its life cycle. */
export type DefaultPreferenceMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One default preference milestone, with what the planners need to act on it. */
export class DefaultPreferenceMilestone {
  code: string;
  title: string;
  tags: string[];
  bid: number;
  rate: number;
  reviewer: string;
  updatedAt: number;
  expiresAt: number;
  unit: string;
  status: DefaultPreferenceMilestoneStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    bid: number,
    rate: number,
    reviewer: string,
    updatedAt: number,
    expiresAt: number,
    unit: string,
    status: DefaultPreferenceMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.bid = bid;
    this.rate = rate;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.expiresAt = expiresAt;
    this.unit = unit;
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

  canMoveTo(next: DefaultPreferenceMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultPreferenceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default preference milestone"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.expiresAt + this.rate) * 100) / 100;
  }

  copy(): DefaultPreferenceMilestone {
    return new DefaultPreferenceMilestone(
      this.code,
      this.title,
      this.tags,
      this.bid,
      this.rate,
      this.reviewer,
      this.updatedAt,
      this.expiresAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default preference milestone in status open. */
export function newDefaultPreferenceMilestone(code: string, title: string): DefaultPreferenceMilestone {
  return new DefaultPreferenceMilestone(code, title, [], 0, 0, "", 0, 0, "", "open");
}
