import * as text from "../../../../kit/text.js";

/** Where a fallback post score is in its life cycle. */
export type FallbackPostScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback post score. Its code is unique within a tenant. */
export class FallbackPostScore {
  code: string;
  title: string;
  revision: number;
  ceiling: number;
  category: string;
  status: FallbackPostScoreStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    ceiling: number,
    category: string,
    status: FallbackPostScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.ceiling = ceiling;
    this.category = category;
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

  canMoveTo(next: FallbackPostScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPostScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback post score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"fallback post score"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.ceiling - this.revision) * 100) / 100;
  }

  copy(): FallbackPostScore {
    return new FallbackPostScore(this.code, this.title, this.revision, this.ceiling, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback post score in status planned. */
export function newFallbackPostScore(code: string, title: string): FallbackPostScore {
  return new FallbackPostScore(code, title, 0, 0, "", "planned");
}
