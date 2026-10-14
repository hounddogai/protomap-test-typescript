import * as text from "../../../../kit/text.js";

/** Where a legacy creative segment is in its life cycle. */
export type LegacyCreativeSegmentStatus = "created" | "validated" | "published" | "retired";

/** One legacy creative segment, with what the planners need to act on it. */
export class LegacyCreativeSegment {
  code: string;
  title: string;
  category: string;
  source: string;
  score: number;
  name: string;
  threshold: number;
  reviewer: string;
  contactEmail: string;
  budget: number;
  externalRef: string;
  status: LegacyCreativeSegmentStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    source: string,
    score: number,
    name: string,
    threshold: number,
    reviewer: string,
    contactEmail: string,
    budget: number,
    externalRef: string,
    status: LegacyCreativeSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.source = source;
    this.score = score;
    this.name = name;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.externalRef = externalRef;
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

  canMoveTo(next: LegacyCreativeSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyCreativeSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy creative segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.score - this.threshold) * 100) / 100;
  }

  copy(): LegacyCreativeSegment {
    return new LegacyCreativeSegment(
      this.code,
      this.title,
      this.category,
      this.source,
      this.score,
      this.name,
      this.threshold,
      this.reviewer,
      this.contactEmail,
      this.budget,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy creative segment in status created. */
export function newLegacyCreativeSegment(code: string, title: string): LegacyCreativeSegment {
  return new LegacyCreativeSegment(code, title, "", "", 0, "", 0, "", "", 0, "", "created");
}
