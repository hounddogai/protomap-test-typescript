import * as text from "../../../../kit/text.js";

/** Where a bounce baseline is in its life cycle. */
export type BounceBaselineStatus = "created" | "validated" | "published" | "retired";

/** A bounce baseline. Its code is unique within a tenant. */
export class BounceBaseline {
  code: string;
  title: string;
  graceDays: number;
  retries: number;
  reviewer: string;
  attributes: Map<string, string>;
  margin: number;
  attempts: number;
  status: BounceBaselineStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    retries: number,
    reviewer: string,
    attributes: Map<string, string>,
    margin: number,
    attempts: number,
    status: BounceBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.retries = retries;
    this.reviewer = reviewer;
    this.attributes = attributes;
    this.margin = margin;
    this.attempts = attempts;
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

  canMoveTo(next: BounceBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bounce baseline"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round(this.graceDays * this.attempts * 100) / 100;
  }

  copy(): BounceBaseline {
    return new BounceBaseline(
      this.code,
      this.title,
      this.graceDays,
      this.retries,
      this.reviewer,
      this.attributes,
      this.margin,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bounce baseline in status created. */
export function newBounceBaseline(code: string, title: string): BounceBaseline {
  return new BounceBaseline(code, title, 0, 0, "", new Map<string, string>(), 0, 0, "created");
}
