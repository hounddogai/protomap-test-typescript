import * as text from "../../../../kit/text.js";

/** Where a fallback branch plan is in its life cycle. */
export type FallbackBranchPlanStatus = "created" | "validated" | "published" | "retired";

/** One fallback branch plan, with what the planners need to act on it. */
export class FallbackBranchPlan {
  code: string;
  name: string;
  segment: string;
  pinned: boolean;
  openRate: number;
  contactEmail: string;
  timezone: string;
  locale: string;
  priority: number;
  attempts: number;
  minimum: number;
  status: FallbackBranchPlanStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    pinned: boolean,
    openRate: number,
    contactEmail: string,
    timezone: string,
    locale: string,
    priority: number,
    attempts: number,
    minimum: number,
    status: FallbackBranchPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.pinned = pinned;
    this.openRate = openRate;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.locale = locale;
    this.priority = priority;
    this.attempts = attempts;
    this.minimum = minimum;
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

  canMoveTo(next: FallbackBranchPlanStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FallbackBranchPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback branch plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.minimum - this.openRate) * 100) / 100;
  }

  copy(): FallbackBranchPlan {
    return new FallbackBranchPlan(
      this.code,
      this.name,
      this.segment,
      this.pinned,
      this.openRate,
      this.contactEmail,
      this.timezone,
      this.locale,
      this.priority,
      this.attempts,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback branch plan in status created. */
export function newFallbackBranchPlan(code: string, name: string): FallbackBranchPlan {
  return new FallbackBranchPlan(code, name, "", false, 0, "", "", "", 0, 0, 0, "created");
}
