import * as text from "../../../../kit/text.js";

/** Where a tiered bounce milestone is in its life cycle. */
export type TieredBounceMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered bounce milestone, with what the planners need to act on it. */
export class TieredBounceMilestone {
  code: string;
  name: string;
  priority: number;
  retries: number;
  ratio: number;
  title: string;
  channel: string;
  status: TieredBounceMilestoneStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    retries: number,
    ratio: number,
    title: string,
    channel: string,
    status: TieredBounceMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.retries = retries;
    this.ratio = ratio;
    this.title = title;
    this.channel = channel;
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

  canMoveTo(next: TieredBounceMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredBounceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered bounce milestone"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.priority * this.ratio * 100) / 100;
  }

  copy(): TieredBounceMilestone {
    return new TieredBounceMilestone(
      this.code,
      this.name,
      this.priority,
      this.retries,
      this.ratio,
      this.title,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered bounce milestone in status planned. */
export function newTieredBounceMilestone(code: string, name: string): TieredBounceMilestone {
  return new TieredBounceMilestone(code, name, 0, 0, 0, "", "", "planned");
}
