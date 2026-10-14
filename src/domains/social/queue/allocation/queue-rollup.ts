import * as text from "../../../../kit/text.js";

/** Where a queue rollup is in its life cycle. */
export type QueueRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One queue rollup, with what the planners need to act on it. */
export class QueueRollup {
  code: string;
  label: string;
  notes: string;
  phone: string;
  audienceId: string;
  score: number;
  status: QueueRollupStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    phone: string,
    audienceId: string,
    score: number,
    status: QueueRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.phone = phone;
    this.audienceId = audienceId;
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

  canMoveTo(next: QueueRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: QueueRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"queue rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): QueueRollup {
    return new QueueRollup(this.code, this.label, this.notes, this.phone, this.audienceId, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a queue rollup in status new. */
export function newQueueRollup(code: string, label: string): QueueRollup {
  return new QueueRollup(code, label, "", "", "", 0, "new");
}
