import * as text from "../../../../kit/text.js";

/** Where a lenient cohort quota is in its life cycle. */
export type LenientCohortQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient cohort quota. Its code is unique within a tenant. */
export class LenientCohortQuota {
  code: string;
  name: string;
  label: string;
  archived: boolean;
  sequence: number;
  clicks: number;
  status: LenientCohortQuotaStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    archived: boolean,
    sequence: number,
    clicks: number,
    status: LenientCohortQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.archived = archived;
    this.sequence = sequence;
    this.clicks = clicks;
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

  canMoveTo(next: LenientCohortQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientCohortQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient cohort quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient cohort quota"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.sequence + this.clicks) * 100) / 100;
  }

  copy(): LenientCohortQuota {
    return new LenientCohortQuota(
      this.code,
      this.name,
      this.label,
      this.archived,
      this.sequence,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient cohort quota in status planned. */
export function newLenientCohortQuota(code: string, name: string): LenientCohortQuota {
  return new LenientCohortQuota(code, name, "", false, 0, 0, "planned");
}
