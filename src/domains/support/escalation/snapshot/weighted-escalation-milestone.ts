import * as text from "../../../../kit/text.js";

/** Where a weighted escalation milestone is in its life cycle. */
export type WeightedEscalationMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted escalation milestone as the escalation team keeps it. */
export class WeightedEscalationMilestone {
  code: string;
  title: string;
  priority: number;
  retries: number;
  audienceId: string;
  threshold: number;
  status: WeightedEscalationMilestoneStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    retries: number,
    audienceId: string,
    threshold: number,
    status: WeightedEscalationMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.retries = retries;
    this.audienceId = audienceId;
    this.threshold = threshold;
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

  canMoveTo(next: WeightedEscalationMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: WeightedEscalationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.retries * 100) / 100;
  }

  copy(): WeightedEscalationMilestone {
    return new WeightedEscalationMilestone(
      this.code,
      this.title,
      this.priority,
      this.retries,
      this.audienceId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted escalation milestone in status planned. */
export function newWeightedEscalationMilestone(code: string, title: string): WeightedEscalationMilestone {
  return new WeightedEscalationMilestone(code, title, 0, 0, "", 0, "planned");
}
