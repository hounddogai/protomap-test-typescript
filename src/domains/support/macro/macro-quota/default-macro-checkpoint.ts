import * as text from "../../../../kit/text.js";

/** Where a default macro checkpoint is in its life cycle. */
export type DefaultMacroCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a default macro checkpoint and its current status. */
export class DefaultMacroCheckpoint {
  code: string;
  title: string;
  sendAt: number;
  threshold: number;
  graceDays: number;
  windowDays: number;
  limit: number;
  status: DefaultMacroCheckpointStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    threshold: number,
    graceDays: number,
    windowDays: number,
    limit: number,
    status: DefaultMacroCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.threshold = threshold;
    this.graceDays = graceDays;
    this.windowDays = windowDays;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultMacroCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultMacroCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default macro checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round(this.threshold * this.graceDays * 100) / 100;
  }

  copy(): DefaultMacroCheckpoint {
    return new DefaultMacroCheckpoint(
      this.code,
      this.title,
      this.sendAt,
      this.threshold,
      this.graceDays,
      this.windowDays,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default macro checkpoint in status draft. */
export function newDefaultMacroCheckpoint(code: string, title: string): DefaultMacroCheckpoint {
  return new DefaultMacroCheckpoint(code, title, 0, 0, 0, 0, 0, "draft");
}
