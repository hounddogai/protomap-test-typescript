import * as text from "../../../../kit/text.js";

/** Where a conversion schedule is in its life cycle. */
export type ConversionScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A conversion schedule as the conversion team keeps it. */
export class ConversionSchedule {
  code: string;
  label: string;
  durationMinutes: number;
  openRate: number;
  reviewer: string;
  tags: string[];
  notes: string;
  budget: number;
  segment: string;
  status: ConversionScheduleStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    openRate: number,
    reviewer: string,
    tags: string[],
    notes: string,
    budget: number,
    segment: string,
    status: ConversionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.openRate = openRate;
    this.reviewer = reviewer;
    this.tags = tags;
    this.notes = notes;
    this.budget = budget;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ConversionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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
    return Math.round((this.durationMinutes + this.budget) * 100) / 100;
  }

  copy(): ConversionSchedule {
    return new ConversionSchedule(
      this.code,
      this.label,
      this.durationMinutes,
      this.openRate,
      this.reviewer,
      this.tags,
      this.notes,
      this.budget,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion schedule in status draft. */
export function newConversionSchedule(code: string, label: string): ConversionSchedule {
  return new ConversionSchedule(code, label, 0, 0, "", [], "", 0, "", "draft");
}
