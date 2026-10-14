import * as text from "../../../../kit/text.js";

/** Where a warmup exception is in its life cycle. */
export type WarmupExceptionStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a warmup exception and its current status. */
export class WarmupException {
  code: string;
  name: string;
  audienceId: string;
  priority: number;
  frequencyCap: number;
  attempts: number;
  status: WarmupExceptionStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    priority: number,
    frequencyCap: number,
    attempts: number,
    status: WarmupExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.priority = priority;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
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

  canMoveTo(next: WarmupExceptionStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"warmup exception"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.attempts - this.frequencyCap) * 100) / 100;
  }

  copy(): WarmupException {
    return new WarmupException(
      this.code,
      this.name,
      this.audienceId,
      this.priority,
      this.frequencyCap,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup exception in status new. */
export function newWarmupException(code: string, name: string): WarmupException {
  return new WarmupException(code, name, "", 0, 0, 0, "new");
}
