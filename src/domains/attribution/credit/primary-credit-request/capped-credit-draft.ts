import * as text from "../../../../kit/text.js";

/** Where a capped credit draft is in its life cycle. */
export type CappedCreditDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One capped credit draft, with what the planners need to act on it. */
export class CappedCreditDraft {
  code: string;
  title: string;
  sequence: number;
  graceDays: number;
  archived: boolean;
  capacity: number;
  status: CappedCreditDraftStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    graceDays: number,
    archived: boolean,
    capacity: number,
    status: CappedCreditDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.graceDays = graceDays;
    this.archived = archived;
    this.capacity = capacity;
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

  canMoveTo(next: CappedCreditDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedCreditDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped credit draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped credit draft"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity + this.graceDays) * 100) / 100;
  }

  copy(): CappedCreditDraft {
    return new CappedCreditDraft(
      this.code,
      this.title,
      this.sequence,
      this.graceDays,
      this.archived,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped credit draft in status planned. */
export function newCappedCreditDraft(code: string, title: string): CappedCreditDraft {
  return new CappedCreditDraft(code, title, 0, 0, false, 0, "planned");
}
