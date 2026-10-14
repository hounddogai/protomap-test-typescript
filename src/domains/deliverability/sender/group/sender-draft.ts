import * as text from "../../../../kit/text.js";

/** Where a sender draft is in its life cycle. */
export type SenderDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One sender draft, with what the planners need to act on it. */
export class SenderDraft {
  code: string;
  label: string;
  margin: number;
  summary: string;
  reviewer: string;
  journeyId: string;
  capacity: number;
  durationMinutes: number;
  pinned: boolean;
  status: SenderDraftStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    summary: string,
    reviewer: string,
    journeyId: string,
    capacity: number,
    durationMinutes: number,
    pinned: boolean,
    status: SenderDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.summary = summary;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
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

  canMoveTo(next: SenderDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SenderDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round(this.capacity * this.durationMinutes * 100) / 100;
  }

  copy(): SenderDraft {
    return new SenderDraft(
      this.code,
      this.label,
      this.margin,
      this.summary,
      this.reviewer,
      this.journeyId,
      this.capacity,
      this.durationMinutes,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender draft in status planned. */
export function newSenderDraft(code: string, label: string): SenderDraft {
  return new SenderDraft(code, label, 0, "", "", "", 0, 0, false, "planned");
}
