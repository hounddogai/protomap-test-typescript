import * as text from "../../../../kit/text.js";

/** Where a tiered window milestone is in its life cycle. */
export type TieredWindowMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered window milestone as the window team keeps it. */
export class TieredWindowMilestone {
  code: string;
  label: string;
  durationMinutes: number;
  priority: number;
  ratio: number;
  name: string;
  rate: number;
  discount: number;
  checksum: string;
  channel: string;
  updatedAt: number;
  status: TieredWindowMilestoneStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    priority: number,
    ratio: number,
    name: string,
    rate: number,
    discount: number,
    checksum: string,
    channel: string,
    updatedAt: number,
    status: TieredWindowMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.ratio = ratio;
    this.name = name;
    this.rate = rate;
    this.discount = discount;
    this.checksum = checksum;
    this.channel = channel;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredWindowMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: TieredWindowMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered window milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.updatedAt * this.priority * 100) / 100;
  }

  copy(): TieredWindowMilestone {
    return new TieredWindowMilestone(
      this.code,
      this.label,
      this.durationMinutes,
      this.priority,
      this.ratio,
      this.name,
      this.rate,
      this.discount,
      this.checksum,
      this.channel,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered window milestone in status open. */
export function newTieredWindowMilestone(code: string, label: string): TieredWindowMilestone {
  return new TieredWindowMilestone(code, label, 0, 0, 0, "", 0, 0, "", "", 0, "open");
}
