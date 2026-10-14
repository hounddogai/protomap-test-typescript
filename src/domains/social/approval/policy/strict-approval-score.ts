import * as text from "../../../../kit/text.js";

/** Where a strict approval score is in its life cycle. */
export type StrictApprovalScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a strict approval score and its current status. */
export class StrictApprovalScore {
  code: string;
  label: string;
  maximum: number;
  windowDays: number;
  revision: number;
  cost: number;
  durationMinutes: number;
  status: StrictApprovalScoreStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    windowDays: number,
    revision: number,
    cost: number,
    durationMinutes: number,
    status: StrictApprovalScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.windowDays = windowDays;
    this.revision = revision;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictApprovalScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictApprovalScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict approval score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.revision * this.windowDays * 100) / 100;
  }

  copy(): StrictApprovalScore {
    return new StrictApprovalScore(
      this.code,
      this.label,
      this.maximum,
      this.windowDays,
      this.revision,
      this.cost,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict approval score in status idle. */
export function newStrictApprovalScore(code: string, label: string): StrictApprovalScore {
  return new StrictApprovalScore(code, label, 0, 0, 0, 0, 0, "idle");
}
