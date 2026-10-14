import * as text from "../../../../kit/text.js";

/** Where a escalation milestone is in its life cycle. */
export type EscalationMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One escalation milestone, with what the planners need to act on it. */
export class EscalationMilestone {
  code: string;
  name: string;
  frequencyCap: number;
  journeyId: string;
  title: string;
  weight: number;
  maximum: number;
  cost: number;
  status: EscalationMilestoneStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    journeyId: string,
    title: string,
    weight: number,
    maximum: number,
    cost: number,
    status: EscalationMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.journeyId = journeyId;
    this.title = title;
    this.weight = weight;
    this.maximum = maximum;
    this.cost = cost;
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

  canMoveTo(next: EscalationMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: EscalationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round(this.frequencyCap * this.weight * 100) / 100;
  }

  copy(): EscalationMilestone {
    return new EscalationMilestone(
      this.code,
      this.name,
      this.frequencyCap,
      this.journeyId,
      this.title,
      this.weight,
      this.maximum,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a escalation milestone in status idle. */
export function newEscalationMilestone(code: string, name: string): EscalationMilestone {
  return new EscalationMilestone(code, name, 0, "", "", 0, 0, 0, "idle");
}
