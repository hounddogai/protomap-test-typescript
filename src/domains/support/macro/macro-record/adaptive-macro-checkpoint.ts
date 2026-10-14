import * as text from "../../../../kit/text.js";

/** Where a adaptive macro checkpoint is in its life cycle. */
export type AdaptiveMacroCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive macro checkpoint as the macro team keeps it. */
export class AdaptiveMacroCheckpoint {
  code: string;
  name: string;
  score: number;
  ceiling: number;
  expiresAt: number;
  status: AdaptiveMacroCheckpointStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    ceiling: number,
    expiresAt: number,
    status: AdaptiveMacroCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.ceiling = ceiling;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveMacroCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveMacroCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive macro checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.ceiling * this.expiresAt * 100) / 100;
  }

  copy(): AdaptiveMacroCheckpoint {
    return new AdaptiveMacroCheckpoint(this.code, this.name, this.score, this.ceiling, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive macro checkpoint in status planned. */
export function newAdaptiveMacroCheckpoint(code: string, name: string): AdaptiveMacroCheckpoint {
  return new AdaptiveMacroCheckpoint(code, name, 0, 0, 0, "planned");
}
