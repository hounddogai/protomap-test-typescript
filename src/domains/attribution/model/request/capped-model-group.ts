import * as text from "../../../../kit/text.js";

/** Where a capped model group is in its life cycle. */
export type CappedModelGroupStatus = "created" | "validated" | "published" | "retired";

/** One capped model group, with what the planners need to act on it. */
export class CappedModelGroup {
  code: string;
  label: string;
  active: boolean;
  windowDays: number;
  unit: string;
  reviewer: string;
  retries: number;
  variant: string;
  cohort: string;
  tags: string[];
  startsAt: number;
  status: CappedModelGroupStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    windowDays: number,
    unit: string,
    reviewer: string,
    retries: number,
    variant: string,
    cohort: string,
    tags: string[],
    startsAt: number,
    status: CappedModelGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.windowDays = windowDays;
    this.unit = unit;
    this.reviewer = reviewer;
    this.retries = retries;
    this.variant = variant;
    this.cohort = cohort;
    this.tags = tags;
    this.startsAt = startsAt;
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

  canMoveTo(next: CappedModelGroupStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedModelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped model group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
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

  weightedLoad(): number {
    return Math.round((this.windowDays - this.startsAt) * 100) / 100;
  }

  copy(): CappedModelGroup {
    return new CappedModelGroup(
      this.code,
      this.label,
      this.active,
      this.windowDays,
      this.unit,
      this.reviewer,
      this.retries,
      this.variant,
      this.cohort,
      this.tags,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped model group in status created. */
export function newCappedModelGroup(code: string, label: string): CappedModelGroup {
  return new CappedModelGroup(code, label, false, 0, "", "", 0, "", "", [], 0, "created");
}
