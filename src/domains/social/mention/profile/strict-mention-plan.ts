import * as text from "../../../../kit/text.js";

/** Where a strict mention plan is in its life cycle. */
export type StrictMentionPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict mention plan. Its code is unique within a tenant. */
export class StrictMentionPlan {
  code: string;
  label: string;
  variant: string;
  notes: string;
  sequence: number;
  attempts: number;
  tags: string[];
  approved: boolean;
  active: boolean;
  region: string;
  score: number;
  status: StrictMentionPlanStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    notes: string,
    sequence: number,
    attempts: number,
    tags: string[],
    approved: boolean,
    active: boolean,
    region: string,
    score: number,
    status: StrictMentionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.notes = notes;
    this.sequence = sequence;
    this.attempts = attempts;
    this.tags = tags;
    this.approved = approved;
    this.active = active;
    this.region = region;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictMentionPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictMentionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict mention plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict mention plan"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.sequence - this.score) * 100) / 100;
  }

  copy(): StrictMentionPlan {
    return new StrictMentionPlan(
      this.code,
      this.label,
      this.variant,
      this.notes,
      this.sequence,
      this.attempts,
      this.tags,
      this.approved,
      this.active,
      this.region,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict mention plan in status proposed. */
export function newStrictMentionPlan(code: string, label: string): StrictMentionPlan {
  return new StrictMentionPlan(code, label, "", "", 0, 0, [], false, false, "", 0, "proposed");
}
