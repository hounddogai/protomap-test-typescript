import * as text from "../../../../kit/text.js";

/** Where a adaptive preference target is in its life cycle. */
export type AdaptivePreferenceTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive preference target, with what the planners need to act on it. */
export class AdaptivePreferenceTarget {
  code: string;
  label: string;
  clicks: number;
  createdAt: number;
  budget: number;
  status: AdaptivePreferenceTargetStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    createdAt: number,
    budget: number,
    status: AdaptivePreferenceTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.createdAt = createdAt;
    this.budget = budget;
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

  canMoveTo(next: AdaptivePreferenceTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: AdaptivePreferenceTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive preference target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive preference target"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.clicks * this.createdAt * 100) / 100;
  }

  copy(): AdaptivePreferenceTarget {
    return new AdaptivePreferenceTarget(this.code, this.label, this.clicks, this.createdAt, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive preference target in status planned. */
export function newAdaptivePreferenceTarget(code: string, label: string): AdaptivePreferenceTarget {
  return new AdaptivePreferenceTarget(code, label, 0, 0, 0, "planned");
}
