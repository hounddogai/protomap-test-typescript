import * as text from "../../../../kit/text.js";

/** Where a escalation exception is in its life cycle. */
export type EscalationExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a escalation exception and its current status. */
export class EscalationException {
  code: string;
  name: string;
  reviewer: string;
  budget: number;
  openRate: number;
  startsAt: number;
  status: EscalationExceptionStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    budget: number,
    openRate: number,
    startsAt: number,
    status: EscalationExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.budget = budget;
    this.openRate = openRate;
    this.startsAt = startsAt;
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

  canMoveTo(next: EscalationExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: EscalationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.openRate - this.budget) * 100) / 100;
  }

  copy(): EscalationException {
    return new EscalationException(
      this.code,
      this.name,
      this.reviewer,
      this.budget,
      this.openRate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation exception in status idle. */
export function newEscalationException(code: string, name: string): EscalationException {
  return new EscalationException(code, name, "", 0, 0, 0, "idle");
}
