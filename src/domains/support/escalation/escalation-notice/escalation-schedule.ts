import * as text from "../../../../kit/text.js";

/** Where a escalation schedule is in its life cycle. */
export type EscalationScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A escalation schedule. Its code is unique within a tenant. */
export class EscalationSchedule {
  code: string;
  label: string;
  source: string;
  ratio: number;
  pinned: boolean;
  impressions: number;
  floorValue: number;
  visible: boolean;
  name: string;
  cost: number;
  status: EscalationScheduleStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    ratio: number,
    pinned: boolean,
    impressions: number,
    floorValue: number,
    visible: boolean,
    name: string,
    cost: number,
    status: EscalationScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.ratio = ratio;
    this.pinned = pinned;
    this.impressions = impressions;
    this.floorValue = floorValue;
    this.visible = visible;
    this.name = name;
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

  canMoveTo(next: EscalationScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: EscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.floorValue * this.cost * 100) / 100;
  }

  copy(): EscalationSchedule {
    return new EscalationSchedule(
      this.code,
      this.label,
      this.source,
      this.ratio,
      this.pinned,
      this.impressions,
      this.floorValue,
      this.visible,
      this.name,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a escalation schedule in status idle. */
export function newEscalationSchedule(code: string, label: string): EscalationSchedule {
  return new EscalationSchedule(code, label, "", 0, false, 0, 0, false, "", 0, "idle");
}
