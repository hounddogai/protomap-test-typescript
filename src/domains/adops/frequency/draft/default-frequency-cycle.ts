import * as text from "../../../../kit/text.js";

/** Where a default frequency cycle is in its life cycle. */
export type DefaultFrequencyCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a default frequency cycle and its current status. */
export class DefaultFrequencyCycle {
  code: string;
  title: string;
  graceDays: number;
  startsAt: number;
  batchSize: number;
  archived: boolean;
  status: DefaultFrequencyCycleStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    startsAt: number,
    batchSize: number,
    archived: boolean,
    status: DefaultFrequencyCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.archived = archived;
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

  canMoveTo(next: DefaultFrequencyCycleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DefaultFrequencyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default frequency cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt + this.batchSize) * 100) / 100;
  }

  copy(): DefaultFrequencyCycle {
    return new DefaultFrequencyCycle(
      this.code,
      this.title,
      this.graceDays,
      this.startsAt,
      this.batchSize,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default frequency cycle in status new. */
export function newDefaultFrequencyCycle(code: string, title: string): DefaultFrequencyCycle {
  return new DefaultFrequencyCycle(code, title, 0, 0, 0, false, "new");
}
