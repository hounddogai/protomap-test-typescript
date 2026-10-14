import * as text from "../../../../kit/text.js";

/** Where a enrollment cycle is in its life cycle. */
export type EnrollmentCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a enrollment cycle and its current status. */
export class EnrollmentCycle {
  code: string;
  name: string;
  description: string;
  attributes: Map<string, string>;
  tags: string[];
  locale: string;
  clicks: number;
  createdAt: number;
  status: EnrollmentCycleStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    attributes: Map<string, string>,
    tags: string[],
    locale: string,
    clicks: number,
    createdAt: number,
    status: EnrollmentCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.attributes = attributes;
    this.tags = tags;
    this.locale = locale;
    this.clicks = clicks;
    this.createdAt = createdAt;
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

  canMoveTo(next: EnrollmentCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: EnrollmentCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.clicks * this.createdAt * 100) / 100;
  }

  copy(): EnrollmentCycle {
    return new EnrollmentCycle(
      this.code,
      this.name,
      this.description,
      this.attributes,
      this.tags,
      this.locale,
      this.clicks,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment cycle in status planned. */
export function newEnrollmentCycle(code: string, name: string): EnrollmentCycle {
  return new EnrollmentCycle(code, name, "", new Map<string, string>(), [], "", 0, 0, "planned");
}
