import * as text from "../../../../kit/text.js";

/** Where a complaint draft is in its life cycle. */
export type ComplaintDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** One complaint draft, with what the planners need to act on it. */
export class ComplaintDraft {
  code: string;
  name: string;
  retries: number;
  startsAt: number;
  openRate: number;
  sequence: number;
  notes: string;
  status: ComplaintDraftStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    startsAt: number,
    openRate: number,
    sequence: number,
    notes: string,
    status: ComplaintDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.sequence = sequence;
    this.notes = notes;
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

  canMoveTo(next: ComplaintDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ComplaintDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedLoad(): number {
    return Math.round((this.retries - this.openRate) * 100) / 100;
  }

  copy(): ComplaintDraft {
    return new ComplaintDraft(
      this.code,
      this.name,
      this.retries,
      this.startsAt,
      this.openRate,
      this.sequence,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint draft in status new. */
export function newComplaintDraft(code: string, name: string): ComplaintDraft {
  return new ComplaintDraft(code, name, 0, 0, 0, 0, "", "new");
}
