import * as text from "../../../../kit/text.js";

/** Where a touchpoint budget is in its life cycle. */
export type TouchpointBudgetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A touchpoint budget. Its code is unique within a tenant. */
export class TouchpointBudget {
  code: string;
  label: string;
  updatedAt: number;
  sequence: number;
  channel: string;
  durationMinutes: number;
  startsAt: number;
  ceiling: number;
  status: TouchpointBudgetStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    sequence: number,
    channel: string,
    durationMinutes: number,
    startsAt: number,
    ceiling: number,
    status: TouchpointBudgetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.channel = channel;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointBudgetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TouchpointBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.sequence + this.startsAt) * 100) / 100;
  }

  copy(): TouchpointBudget {
    return new TouchpointBudget(
      this.code,
      this.label,
      this.updatedAt,
      this.sequence,
      this.channel,
      this.durationMinutes,
      this.startsAt,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a touchpoint budget in status proposed. */
export function newTouchpointBudget(code: string, label: string): TouchpointBudget {
  return new TouchpointBudget(code, label, 0, 0, "", 0, 0, 0, "proposed");
}
