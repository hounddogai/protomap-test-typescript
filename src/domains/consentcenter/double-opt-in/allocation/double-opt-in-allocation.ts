/**
 * The double opt in allocation records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a double opt in allocation is in its life cycle. */
export type DoubleOptInAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A double opt in allocation. Its code is unique within a tenant. */
export class DoubleOptInAllocation {
  code: string;
  title: string;
  timezone: string;
  notes: string;
  locale: string;
  summary: string;
  ownerId: string;
  tags: string[];
  ratio: number;
  margin: number;
  attributes: Map<string, string>;
  status: DoubleOptInAllocationStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    notes: string,
    locale: string,
    summary: string,
    ownerId: string,
    tags: string[],
    ratio: number,
    margin: number,
    attributes: Map<string, string>,
    status: DoubleOptInAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.notes = notes;
    this.locale = locale;
    this.summary = summary;
    this.ownerId = ownerId;
    this.tags = tags;
    this.ratio = ratio;
    this.margin = margin;
    this.attributes = attributes;
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

  canMoveTo(next: DoubleOptInAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
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

  weightedTotal(): number {
    return Math.round(this.margin * this.ratio * 100) / 100;
  }

  copy(): DoubleOptInAllocation {
    return new DoubleOptInAllocation(
      this.code,
      this.title,
      this.timezone,
      this.notes,
      this.locale,
      this.summary,
      this.ownerId,
      this.tags,
      this.ratio,
      this.margin,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a double opt in allocation in status planned. */
export function newDoubleOptInAllocation(code: string, title: string): DoubleOptInAllocation {
  return new DoubleOptInAllocation(code, title, "", "", "", "", "", [], 0, 0, new Map<string, string>(), "planned");
}
