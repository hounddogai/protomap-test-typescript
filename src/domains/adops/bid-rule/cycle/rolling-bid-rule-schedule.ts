import * as text from "../../../../kit/text.js";

/** Where a rolling bid rule schedule is in its life cycle. */
export type RollingBidRuleScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling bid rule schedule, with what the planners need to act on it. */
export class RollingBidRuleSchedule {
  code: string;
  name: string;
  version: number;
  margin: number;
  createdAt: number;
  revision: number;
  category: string;
  impressions: number;
  status: RollingBidRuleScheduleStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    margin: number,
    createdAt: number,
    revision: number,
    category: string,
    impressions: number,
    status: RollingBidRuleScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.margin = margin;
    this.createdAt = createdAt;
    this.revision = revision;
    this.category = category;
    this.impressions = impressions;
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

  canMoveTo(next: RollingBidRuleScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingBidRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling bid rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.impressions + this.revision) * 100) / 100;
  }

  copy(): RollingBidRuleSchedule {
    return new RollingBidRuleSchedule(
      this.code,
      this.name,
      this.version,
      this.margin,
      this.createdAt,
      this.revision,
      this.category,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a rolling bid rule schedule in status planned. */
export function newRollingBidRuleSchedule(code: string, name: string): RollingBidRuleSchedule {
  return new RollingBidRuleSchedule(code, name, 0, 0, 0, 0, "", 0, "planned");
}
