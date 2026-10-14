import * as text from "../../../../kit/text.js";

/** Where a insight assignment is in its life cycle. */
export type InsightAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One insight assignment, with what the planners need to act on it. */
export class InsightAssignment {
  code: string;
  title: string;
  sequence: number;
  campaignRef: string;
  startsAt: number;
  priority: number;
  channel: string;
  rate: number;
  conversionRate: number;
  status: InsightAssignmentStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    campaignRef: string,
    startsAt: number,
    priority: number,
    channel: string,
    rate: number,
    conversionRate: number,
    status: InsightAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.priority = priority;
    this.channel = channel;
    this.rate = rate;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: InsightAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InsightAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.conversionRate * this.sequence * 100) / 100;
  }

  copy(): InsightAssignment {
    return new InsightAssignment(
      this.code,
      this.title,
      this.sequence,
      this.campaignRef,
      this.startsAt,
      this.priority,
      this.channel,
      this.rate,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight assignment in status planned. */
export function newInsightAssignment(code: string, title: string): InsightAssignment {
  return new InsightAssignment(code, title, 0, "", 0, 0, "", 0, 0, "planned");
}
