import * as text from "../../../../kit/text.js";

/** Where a sender score is in its life cycle. */
export type SenderScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sender score as the sender team keeps it. */
export class SenderScore {
  code: string;
  title: string;
  variant: string;
  pinned: boolean;
  sequence: number;
  status: SenderScoreStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    pinned: boolean,
    sequence: number,
    status: SenderScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.pinned = pinned;
    this.sequence = sequence;
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

  canMoveTo(next: SenderScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
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

  moveTo(next: SenderScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): SenderScore {
    return new SenderScore(this.code, this.title, this.variant, this.pinned, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender score in status new. */
export function newSenderScore(code: string, title: string): SenderScore {
  return new SenderScore(code, title, "", false, 0, "new");
}
