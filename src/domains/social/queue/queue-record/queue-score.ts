import * as text from "../../../../kit/text.js";

/** Where a queue score is in its life cycle. */
export type QueueScoreStatus = "created" | "validated" | "published" | "retired";

/** The record of a queue score and its current status. */
export class QueueScore {
  code: string;
  name: string;
  weight: number;
  graceDays: number;
  locale: string;
  status: QueueScoreStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    graceDays: number,
    locale: string,
    status: QueueScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.graceDays = graceDays;
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

  canMoveTo(next: QueueScoreStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.graceDays * this.weight * 100) / 100;
  }

  copy(): QueueScore {
    return new QueueScore(this.code, this.name, this.weight, this.graceDays, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a queue score in status created. */
export function newQueueScore(code: string, name: string): QueueScore {
  return new QueueScore(code, name, 0, 0, "", "created");
}
