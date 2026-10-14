import * as text from "../../../../kit/text.js";

/** Where a rolling journey baseline is in its life cycle. */
export type RollingJourneyBaselineStatus = "created" | "validated" | "published" | "retired";

/** A rolling journey baseline. Its code is unique within a tenant. */
export class RollingJourneyBaseline {
  code: string;
  title: string;
  tags: string[];
  revision: number;
  priority: number;
  minimum: number;
  locale: string;
  contactEmail: string;
  floorValue: number;
  active: boolean;
  threshold: number;
  status: RollingJourneyBaselineStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    revision: number,
    priority: number,
    minimum: number,
    locale: string,
    contactEmail: string,
    floorValue: number,
    active: boolean,
    threshold: number,
    status: RollingJourneyBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.revision = revision;
    this.priority = priority;
    this.minimum = minimum;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.active = active;
    this.threshold = threshold;
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

  canMoveTo(next: RollingJourneyBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingJourneyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.revision + this.priority) * 100) / 100;
  }

  copy(): RollingJourneyBaseline {
    return new RollingJourneyBaseline(
      this.code,
      this.title,
      this.tags,
      this.revision,
      this.priority,
      this.minimum,
      this.locale,
      this.contactEmail,
      this.floorValue,
      this.active,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling journey baseline in status created. */
export function newRollingJourneyBaseline(code: string, title: string): RollingJourneyBaseline {
  return new RollingJourneyBaseline(code, title, [], 0, 0, 0, "", "", 0, false, 0, "created");
}
