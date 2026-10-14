/**
 * The journey assignment records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey assignment is in its life cycle. */
export type JourneyAssignmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One journey assignment, with what the planners need to act on it. */
export class JourneyAssignment {
  code: string;
  title: string;
  retries: number;
  country: string;
  utmSource: string;
  pinned: boolean;
  tags: string[];
  category: string;
  ownerId: string;
  locale: string;
  unit: string;
  status: JourneyAssignmentStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    country: string,
    utmSource: string,
    pinned: boolean,
    tags: string[],
    category: string,
    ownerId: string,
    locale: string,
    unit: string,
    status: JourneyAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.country = country;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.tags = tags;
    this.category = category;
    this.ownerId = ownerId;
    this.locale = locale;
    this.unit = unit;
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

  canMoveTo(next: JourneyAssignmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: JourneyAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): JourneyAssignment {
    return new JourneyAssignment(
      this.code,
      this.title,
      this.retries,
      this.country,
      this.utmSource,
      this.pinned,
      this.tags,
      this.category,
      this.ownerId,
      this.locale,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a journey assignment in status planned. */
export function newJourneyAssignment(code: string, title: string): JourneyAssignment {
  return new JourneyAssignment(code, title, 0, "", "", false, [], "", "", "", "", "planned");
}
