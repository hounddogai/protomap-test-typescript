import * as text from "../../../../kit/text.js";

/** Where a scheduled enrollment tier is in its life cycle. */
export type ScheduledEnrollmentTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One scheduled enrollment tier, with what the planners need to act on it. */
export class ScheduledEnrollmentTier {
  code: string;
  title: string;
  label: string;
  quantity: number;
  threshold: number;
  description: string;
  segment: string;
  tags: string[];
  frequencyCap: number;
  status: ScheduledEnrollmentTierStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    quantity: number,
    threshold: number,
    description: string,
    segment: string,
    tags: string[],
    frequencyCap: number,
    status: ScheduledEnrollmentTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.quantity = quantity;
    this.threshold = threshold;
    this.description = description;
    this.segment = segment;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledEnrollmentTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledEnrollmentTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled enrollment tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.frequencyCap + this.quantity) * 100) / 100;
  }

  copy(): ScheduledEnrollmentTier {
    return new ScheduledEnrollmentTier(
      this.code,
      this.title,
      this.label,
      this.quantity,
      this.threshold,
      this.description,
      this.segment,
      this.tags,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled enrollment tier in status new. */
export function newScheduledEnrollmentTier(code: string, title: string): ScheduledEnrollmentTier {
  return new ScheduledEnrollmentTier(code, title, "", 0, 0, "", "", [], 0, "new");
}
