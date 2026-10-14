import * as text from "../../../../kit/text.js";

/** Where a global sla cycle is in its life cycle. */
export type GlobalSlaCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global sla cycle as the sla team keeps it. */
export class GlobalSlaCycle {
  code: string;
  name: string;
  tags: string[];
  clicks: number;
  cohort: string;
  externalRef: string;
  country: string;
  utmSource: string;
  updatedAt: number;
  ceiling: number;
  budget: number;
  status: GlobalSlaCycleStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    clicks: number,
    cohort: string,
    externalRef: string,
    country: string,
    utmSource: string,
    updatedAt: number,
    ceiling: number,
    budget: number,
    status: GlobalSlaCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.clicks = clicks;
    this.cohort = cohort;
    this.externalRef = externalRef;
    this.country = country;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.budget = budget;
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

  canMoveTo(next: GlobalSlaCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
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

  moveTo(next: GlobalSlaCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global sla cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.budget - this.ceiling) * 100) / 100;
  }

  copy(): GlobalSlaCycle {
    return new GlobalSlaCycle(
      this.code,
      this.name,
      this.tags,
      this.clicks,
      this.cohort,
      this.externalRef,
      this.country,
      this.utmSource,
      this.updatedAt,
      this.ceiling,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global sla cycle in status planned. */
export function newGlobalSlaCycle(code: string, name: string): GlobalSlaCycle {
  return new GlobalSlaCycle(code, name, [], 0, "", "", "", "", 0, 0, 0, "planned");
}
