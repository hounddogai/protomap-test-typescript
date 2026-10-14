import * as text from "../../../../kit/text.js";

/** Where a primary mention draft is in its life cycle. */
export type PrimaryMentionDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary mention draft and its current status. */
export class PrimaryMentionDraft {
  code: string;
  title: string;
  currency: string;
  batchSize: number;
  description: string;
  ownerId: string;
  weight: number;
  unit: string;
  status: PrimaryMentionDraftStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    batchSize: number,
    description: string,
    ownerId: string,
    weight: number,
    unit: string,
    status: PrimaryMentionDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.batchSize = batchSize;
    this.description = description;
    this.ownerId = ownerId;
    this.weight = weight;
    this.unit = unit;
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

  canMoveTo(next: PrimaryMentionDraftStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryMentionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary mention draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.weight + this.batchSize) * 100) / 100;
  }

  copy(): PrimaryMentionDraft {
    return new PrimaryMentionDraft(
      this.code,
      this.title,
      this.currency,
      this.batchSize,
      this.description,
      this.ownerId,
      this.weight,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary mention draft in status new. */
export function newPrimaryMentionDraft(code: string, title: string): PrimaryMentionDraft {
  return new PrimaryMentionDraft(code, title, "", 0, "", "", 0, "", "new");
}
