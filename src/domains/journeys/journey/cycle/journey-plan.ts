import * as text from "../../../../kit/text.js";

/** Where a journey plan is in its life cycle. */
export type JourneyPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A journey plan as the journey team keeps it. */
export class JourneyPlan {
  code: string;
  title: string;
  windowDays: number;
  attributes: Map<string, string>;
  clicks: number;
  updatedAt: number;
  revision: number;
  unit: string;
  version: number;
  budget: number;
  status: JourneyPlanStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    attributes: Map<string, string>,
    clicks: number,
    updatedAt: number,
    revision: number,
    unit: string,
    version: number,
    budget: number,
    status: JourneyPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.attributes = attributes;
    this.clicks = clicks;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.unit = unit;
    this.version = version;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: JourneyPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: JourneyPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.clicks + this.updatedAt) * 100) / 100;
  }

  copy(): JourneyPlan {
    return new JourneyPlan(
      this.code,
      this.title,
      this.windowDays,
      this.attributes,
      this.clicks,
      this.updatedAt,
      this.revision,
      this.unit,
      this.version,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a journey plan in status open. */
export function newJourneyPlan(code: string, title: string): JourneyPlan {
  return new JourneyPlan(code, title, 0, new Map<string, string>(), 0, 0, 0, "", 0, 0, "open");
}
