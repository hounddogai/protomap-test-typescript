import * as text from "../../../../kit/text.js";

/** Where a weighted activation segment is in its life cycle. */
export type WeightedActivationSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A weighted activation segment as the activation team keeps it. */
export class WeightedActivationSegment {
  code: string;
  title: string;
  channel: string;
  budget: number;
  variant: string;
  ceiling: number;
  status: WeightedActivationSegmentStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    budget: number,
    variant: string,
    ceiling: number,
    status: WeightedActivationSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.budget = budget;
    this.variant = variant;
    this.ceiling = ceiling;
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

  canMoveTo(next: WeightedActivationSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedActivationSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted activation segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted activation segment"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.ceiling - this.budget) * 100) / 100;
  }

  copy(): WeightedActivationSegment {
    return new WeightedActivationSegment(
      this.code,
      this.title,
      this.channel,
      this.budget,
      this.variant,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted activation segment in status open. */
export function newWeightedActivationSegment(code: string, title: string): WeightedActivationSegment {
  return new WeightedActivationSegment(code, title, "", 0, "", 0, "open");
}
