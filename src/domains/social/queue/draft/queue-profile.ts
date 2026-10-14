import * as text from "../../../../kit/text.js";

/** Where a queue profile is in its life cycle. */
export type QueueProfileStatus = "created" | "validated" | "published" | "retired";

/** A queue profile as the queue team keeps it. */
export class QueueProfile {
  code: string;
  title: string;
  ceiling: number;
  score: number;
  audienceId: string;
  sequence: number;
  limit: number;
  margin: number;
  graceDays: number;
  status: QueueProfileStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    score: number,
    audienceId: string,
    sequence: number,
    limit: number,
    margin: number,
    graceDays: number,
    status: QueueProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.score = score;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.limit = limit;
    this.margin = margin;
    this.graceDays = graceDays;
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

  canMoveTo(next: QueueProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"queue profile"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.ceiling * this.score * 100) / 100;
  }

  copy(): QueueProfile {
    return new QueueProfile(
      this.code,
      this.title,
      this.ceiling,
      this.score,
      this.audienceId,
      this.sequence,
      this.limit,
      this.margin,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue profile in status created. */
export function newQueueProfile(code: string, title: string): QueueProfile {
  return new QueueProfile(code, title, 0, 0, "", 0, 0, 0, 0, "created");
}
