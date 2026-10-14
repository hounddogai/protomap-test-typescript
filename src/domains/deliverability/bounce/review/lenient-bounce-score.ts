import * as text from "../../../../kit/text.js";

/** Where a lenient bounce score is in its life cycle. */
export type LenientBounceScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient bounce score and its current status. */
export class LenientBounceScore {
  code: string;
  title: string;
  campaignRef: string;
  tags: string[];
  archived: boolean;
  budget: number;
  status: LenientBounceScoreStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    tags: string[],
    archived: boolean,
    budget: number,
    status: LenientBounceScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.tags = tags;
    this.archived = archived;
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

  canMoveTo(next: LenientBounceScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBounceScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bounce score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): LenientBounceScore {
    return new LenientBounceScore(
      this.code,
      this.title,
      this.campaignRef,
      this.tags,
      this.archived,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient bounce score in status open. */
export function newLenientBounceScore(code: string, title: string): LenientBounceScore {
  return new LenientBounceScore(code, title, "", [], false, 0, "open");
}
