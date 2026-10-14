import * as text from "../../../../kit/text.js";

/** Where a weighted proof target is in its life cycle. */
export type WeightedProofTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a weighted proof target and its current status. */
export class WeightedProofTarget {
  code: string;
  title: string;
  reviewer: string;
  budget: number;
  pinned: boolean;
  audienceId: string;
  segment: string;
  status: WeightedProofTargetStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    budget: number,
    pinned: boolean,
    audienceId: string,
    segment: string,
    status: WeightedProofTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.budget = budget;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedProofTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedProofTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted proof target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): WeightedProofTarget {
    return new WeightedProofTarget(
      this.code,
      this.title,
      this.reviewer,
      this.budget,
      this.pinned,
      this.audienceId,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted proof target in status idle. */
export function newWeightedProofTarget(code: string, title: string): WeightedProofTarget {
  return new WeightedProofTarget(code, title, "", 0, false, "", "", "idle");
}
