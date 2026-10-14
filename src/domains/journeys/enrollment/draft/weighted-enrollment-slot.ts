import * as text from "../../../../kit/text.js";

/** Where a weighted enrollment slot is in its life cycle. */
export type WeightedEnrollmentSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted enrollment slot, with what the planners need to act on it. */
export class WeightedEnrollmentSlot {
  code: string;
  title: string;
  ratio: number;
  score: number;
  archived: boolean;
  description: string;
  graceDays: number;
  margin: number;
  threshold: number;
  rate: number;
  status: WeightedEnrollmentSlotStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    score: number,
    archived: boolean,
    description: string,
    graceDays: number,
    margin: number,
    threshold: number,
    rate: number,
    status: WeightedEnrollmentSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.score = score;
    this.archived = archived;
    this.description = description;
    this.graceDays = graceDays;
    this.margin = margin;
    this.threshold = threshold;
    this.rate = rate;
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

  canMoveTo(next: WeightedEnrollmentSlotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedEnrollmentSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted enrollment slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round(this.graceDays * this.rate * 100) / 100;
  }

  copy(): WeightedEnrollmentSlot {
    return new WeightedEnrollmentSlot(
      this.code,
      this.title,
      this.ratio,
      this.score,
      this.archived,
      this.description,
      this.graceDays,
      this.margin,
      this.threshold,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted enrollment slot in status new. */
export function newWeightedEnrollmentSlot(code: string, title: string): WeightedEnrollmentSlot {
  return new WeightedEnrollmentSlot(code, title, 0, 0, false, "", 0, 0, 0, 0, "new");
}
