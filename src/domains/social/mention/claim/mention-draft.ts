import * as text from "../../../../kit/text.js";

/** Where a mention draft is in its life cycle. */
export type MentionDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a mention draft and its current status. */
export class MentionDraft {
  code: string;
  name: string;
  graceDays: number;
  score: number;
  segment: string;
  capacity: number;
  ownerId: string;
  currency: string;
  locale: string;
  status: MentionDraftStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    score: number,
    segment: string,
    capacity: number,
    ownerId: string,
    currency: string,
    locale: string,
    status: MentionDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.score = score;
    this.segment = segment;
    this.capacity = capacity;
    this.ownerId = ownerId;
    this.currency = currency;
    this.locale = locale;
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

  canMoveTo(next: MentionDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MentionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.score * this.graceDays * 100) / 100;
  }

  copy(): MentionDraft {
    return new MentionDraft(
      this.code,
      this.name,
      this.graceDays,
      this.score,
      this.segment,
      this.capacity,
      this.ownerId,
      this.currency,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a mention draft in status created. */
export function newMentionDraft(code: string, name: string): MentionDraft {
  return new MentionDraft(code, name, 0, 0, "", 0, "", "", "", "created");
}
