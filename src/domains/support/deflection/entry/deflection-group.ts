import * as text from "../../../../kit/text.js";

/** Where a deflection group is in its life cycle. */
export type DeflectionGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a deflection group and its current status. */
export class DeflectionGroup {
  code: string;
  title: string;
  retries: number;
  tags: string[];
  segment: string;
  region: string;
  category: string;
  windowDays: number;
  batchSize: number;
  frequencyCap: number;
  status: DeflectionGroupStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    tags: string[],
    segment: string,
    region: string,
    category: string,
    windowDays: number,
    batchSize: number,
    frequencyCap: number,
    status: DeflectionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.tags = tags;
    this.segment = segment;
    this.region = region;
    this.category = category;
    this.windowDays = windowDays;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: DeflectionGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
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

  moveTo(next: DeflectionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection group"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.batchSize - this.frequencyCap) * 100) / 100;
  }

  copy(): DeflectionGroup {
    return new DeflectionGroup(
      this.code,
      this.title,
      this.retries,
      this.tags,
      this.segment,
      this.region,
      this.category,
      this.windowDays,
      this.batchSize,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a deflection group in status planned. */
export function newDeflectionGroup(code: string, title: string): DeflectionGroup {
  return new DeflectionGroup(code, title, 0, [], "", "", "", 0, 0, 0, "planned");
}
