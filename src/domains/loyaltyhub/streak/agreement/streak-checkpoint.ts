import * as text from "../../../../kit/text.js";

/** Where a streak checkpoint is in its life cycle. */
export type StreakCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak checkpoint. Its code is unique within a tenant. */
export class StreakCheckpoint {
  code: string;
  title: string;
  audienceId: string;
  attempts: number;
  variant: string;
  status: StreakCheckpointStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    attempts: number,
    variant: string,
    status: StreakCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.variant = variant;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StreakCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"streak checkpoint"} ${this.code}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): StreakCheckpoint {
    return new StreakCheckpoint(this.code, this.title, this.audienceId, this.attempts, this.variant, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a streak checkpoint in status open. */
export function newStreakCheckpoint(code: string, title: string): StreakCheckpoint {
  return new StreakCheckpoint(code, title, "", 0, "", "open");
}
