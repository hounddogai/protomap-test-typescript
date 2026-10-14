import * as text from "../../../../kit/text.js";

/** Where a reputation metric is in its life cycle. */
export type ReputationMetricStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One reputation metric, with what the planners need to act on it. */
export class ReputationMetric {
  code: string;
  label: string;
  description: string;
  maximum: number;
  threshold: number;
  cohort: string;
  tags: string[];
  active: boolean;
  graceDays: number;
  updatedAt: number;
  attempts: number;
  status: ReputationMetricStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    maximum: number,
    threshold: number,
    cohort: string,
    tags: string[],
    active: boolean,
    graceDays: number,
    updatedAt: number,
    attempts: number,
    status: ReputationMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.maximum = maximum;
    this.threshold = threshold;
    this.cohort = cohort;
    this.tags = tags;
    this.active = active;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
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

  canMoveTo(next: ReputationMetricStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReputationMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round(this.graceDays * this.updatedAt * 100) / 100;
  }

  copy(): ReputationMetric {
    return new ReputationMetric(
      this.code,
      this.label,
      this.description,
      this.maximum,
      this.threshold,
      this.cohort,
      this.tags,
      this.active,
      this.graceDays,
      this.updatedAt,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation metric in status planned. */
export function newReputationMetric(code: string, label: string): ReputationMetric {
  return new ReputationMetric(code, label, "", 0, 0, "", [], false, 0, 0, 0, "planned");
}
