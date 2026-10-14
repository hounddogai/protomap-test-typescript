import * as text from "../../../../kit/text.js";

/** Where a manual retention score is in its life cycle. */
export type ManualRetentionScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual retention score. Its code is unique within a tenant. */
export class ManualRetentionScore {
  code: string;
  name: string;
  approved: boolean;
  limit: number;
  discount: number;
  tags: string[];
  cohort: string;
  cost: number;
  status: ManualRetentionScoreStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    limit: number,
    discount: number,
    tags: string[],
    cohort: string,
    cost: number,
    status: ManualRetentionScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.limit = limit;
    this.discount = discount;
    this.tags = tags;
    this.cohort = cohort;
    this.cost = cost;
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

  canMoveTo(next: ManualRetentionScoreStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualRetentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual retention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual retention score"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.cost + this.discount) * 100) / 100;
  }

  copy(): ManualRetentionScore {
    return new ManualRetentionScore(
      this.code,
      this.name,
      this.approved,
      this.limit,
      this.discount,
      this.tags,
      this.cohort,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual retention score in status open. */
export function newManualRetentionScore(code: string, name: string): ManualRetentionScore {
  return new ManualRetentionScore(code, name, false, 0, 0, [], "", 0, "open");
}
