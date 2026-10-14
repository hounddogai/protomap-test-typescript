import * as text from "../../../../kit/text.js";

/** Where a double opt in draft is in its life cycle. */
export type DoubleOptInDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a double opt in draft and its current status. */
export class DoubleOptInDraft {
  code: string;
  label: string;
  ratio: number;
  discount: number;
  batchSize: number;
  score: number;
  status: DoubleOptInDraftStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    discount: number,
    batchSize: number,
    score: number,
    status: DoubleOptInDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.discount = discount;
    this.batchSize = batchSize;
    this.score = score;
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

  canMoveTo(next: DoubleOptInDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"double opt in draft"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.score + this.discount) * 100) / 100;
  }

  copy(): DoubleOptInDraft {
    return new DoubleOptInDraft(
      this.code,
      this.label,
      this.ratio,
      this.discount,
      this.batchSize,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in draft in status new. */
export function newDoubleOptInDraft(code: string, label: string): DoubleOptInDraft {
  return new DoubleOptInDraft(code, label, 0, 0, 0, 0, "new");
}
