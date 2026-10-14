import * as text from "../../../../kit/text.js";

/** Where a rolling sender plan is in its life cycle. */
export type RollingSenderPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling sender plan, with what the planners need to act on it. */
export class RollingSenderPlan {
  code: string;
  title: string;
  revision: number;
  rate: number;
  timezone: string;
  tags: string[];
  notes: string;
  category: string;
  startsAt: number;
  label: string;
  checksum: string;
  status: RollingSenderPlanStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    rate: number,
    timezone: string,
    tags: string[],
    notes: string,
    category: string,
    startsAt: number,
    label: string,
    checksum: string,
    status: RollingSenderPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.rate = rate;
    this.timezone = timezone;
    this.tags = tags;
    this.notes = notes;
    this.category = category;
    this.startsAt = startsAt;
    this.label = label;
    this.checksum = checksum;
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

  canMoveTo(next: RollingSenderPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingSenderPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling sender plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.rate + this.revision) * 100) / 100;
  }

  copy(): RollingSenderPlan {
    return new RollingSenderPlan(
      this.code,
      this.title,
      this.revision,
      this.rate,
      this.timezone,
      this.tags,
      this.notes,
      this.category,
      this.startsAt,
      this.label,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling sender plan in status planned. */
export function newRollingSenderPlan(code: string, title: string): RollingSenderPlan {
  return new RollingSenderPlan(code, title, 0, 0, "", [], "", "", 0, "", "", "planned");
}
