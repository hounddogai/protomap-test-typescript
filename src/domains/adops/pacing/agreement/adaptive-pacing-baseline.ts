import * as text from "../../../../kit/text.js";

/** Where a adaptive pacing baseline is in its life cycle. */
export type AdaptivePacingBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive pacing baseline. Its code is unique within a tenant. */
export class AdaptivePacingBaseline {
  code: string;
  title: string;
  notes: string;
  cost: number;
  audienceId: string;
  status: AdaptivePacingBaselineStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    cost: number,
    audienceId: string,
    status: AdaptivePacingBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.cost = cost;
    this.audienceId = audienceId;
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

  canMoveTo(next: AdaptivePacingBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: AdaptivePacingBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive pacing baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): AdaptivePacingBaseline {
    return new AdaptivePacingBaseline(this.code, this.title, this.notes, this.cost, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive pacing baseline in status idle. */
export function newAdaptivePacingBaseline(code: string, title: string): AdaptivePacingBaseline {
  return new AdaptivePacingBaseline(code, title, "", 0, "", "idle");
}
