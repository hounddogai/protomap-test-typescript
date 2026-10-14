/**
 * The default csat record records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default csat record is in its life cycle. */
export type DefaultCsatRecordStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One default csat record, with what the planners need to act on it. */
export class DefaultCsatRecord {
  code: string;
  title: string;
  tags: string[];
  expiresAt: number;
  attempts: number;
  budget: number;
  name: string;
  locale: string;
  minimum: number;
  externalRef: string;
  status: DefaultCsatRecordStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    expiresAt: number,
    attempts: number,
    budget: number,
    name: string,
    locale: string,
    minimum: number,
    externalRef: string,
    status: DefaultCsatRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.expiresAt = expiresAt;
    this.attempts = attempts;
    this.budget = budget;
    this.name = name;
    this.locale = locale;
    this.minimum = minimum;
    this.externalRef = externalRef;
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

  canMoveTo(next: DefaultCsatRecordStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "completed";
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

  moveTo(next: DefaultCsatRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default csat record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default csat record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round(this.budget * this.minimum * 100) / 100;
  }

  copy(): DefaultCsatRecord {
    return new DefaultCsatRecord(
      this.code,
      this.title,
      this.tags,
      this.expiresAt,
      this.attempts,
      this.budget,
      this.name,
      this.locale,
      this.minimum,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default csat record in status planned. */
export function newDefaultCsatRecord(code: string, title: string): DefaultCsatRecord {
  return new DefaultCsatRecord(code, title, [], 0, 0, 0, "", "", 0, "", "planned");
}
