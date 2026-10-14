import * as text from "../../../../kit/text.js";

/** Where a global mention rollup is in its life cycle. */
export type GlobalMentionRollupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global mention rollup, with what the planners need to act on it. */
export class GlobalMentionRollup {
  code: string;
  title: string;
  limit: number;
  cohort: string;
  attributes: Map<string, string>;
  quantity: number;
  status: GlobalMentionRollupStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    cohort: string,
    attributes: Map<string, string>,
    quantity: number,
    status: GlobalMentionRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.cohort = cohort;
    this.attributes = attributes;
    this.quantity = quantity;
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

  canMoveTo(next: GlobalMentionRollupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalMentionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global mention rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global mention rollup"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity - this.limit) * 100) / 100;
  }

  copy(): GlobalMentionRollup {
    return new GlobalMentionRollup(
      this.code,
      this.title,
      this.limit,
      this.cohort,
      this.attributes,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global mention rollup in status open. */
export function newGlobalMentionRollup(code: string, title: string): GlobalMentionRollup {
  return new GlobalMentionRollup(code, title, 0, "", new Map<string, string>(), 0, "open");
}
