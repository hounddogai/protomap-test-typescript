import * as text from "../../../../kit/text.js";

/** Where a lenient level draft is in its life cycle. */
export type LenientLevelDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient level draft and its current status. */
export class LenientLevelDraft {
  code: string;
  title: string;
  reviewer: string;
  weight: number;
  capacity: number;
  status: LenientLevelDraftStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    weight: number,
    capacity: number,
    status: LenientLevelDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.weight = weight;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientLevelDraftStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientLevelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient level draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.weight + this.capacity) * 100) / 100;
  }

  copy(): LenientLevelDraft {
    return new LenientLevelDraft(this.code, this.title, this.reviewer, this.weight, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient level draft in status new. */
export function newLenientLevelDraft(code: string, title: string): LenientLevelDraft {
  return new LenientLevelDraft(code, title, "", 0, 0, "new");
}
