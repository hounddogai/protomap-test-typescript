import * as text from "../../../../kit/text.js";

/** Where a post window is in its life cycle. */
export type PostWindowStatus = "created" | "validated" | "published" | "retired";

/** A post window. Its code is unique within a tenant. */
export class PostWindow {
  code: string;
  label: string;
  source: string;
  rate: number;
  checksum: string;
  budget: number;
  graceDays: number;
  cohort: string;
  quantity: number;
  tags: string[];
  summary: string;
  status: PostWindowStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    rate: number,
    checksum: string,
    budget: number,
    graceDays: number,
    cohort: string,
    quantity: number,
    tags: string[],
    summary: string,
    status: PostWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.rate = rate;
    this.checksum = checksum;
    this.budget = budget;
    this.graceDays = graceDays;
    this.cohort = cohort;
    this.quantity = quantity;
    this.tags = tags;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.budget - this.rate) * 100) / 100;
  }

  copy(): PostWindow {
    return new PostWindow(
      this.code,
      this.label,
      this.source,
      this.rate,
      this.checksum,
      this.budget,
      this.graceDays,
      this.cohort,
      this.quantity,
      this.tags,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a post window in status created. */
export function newPostWindow(code: string, label: string): PostWindow {
  return new PostWindow(code, label, "", 0, "", 0, 0, "", 0, [], "", "created");
}
