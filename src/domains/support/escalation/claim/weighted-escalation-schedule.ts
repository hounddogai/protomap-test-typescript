import * as text from "../../../../kit/text.js";

/** Where a weighted escalation schedule is in its life cycle. */
export type WeightedEscalationScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted escalation schedule, with what the planners need to act on it. */
export class WeightedEscalationSchedule {
  code: string;
  label: string;
  title: string;
  visible: boolean;
  sendAt: number;
  graceDays: number;
  sequence: number;
  timezone: string;
  variant: string;
  journeyId: string;
  priority: number;
  status: WeightedEscalationScheduleStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    visible: boolean,
    sendAt: number,
    graceDays: number,
    sequence: number,
    timezone: string,
    variant: string,
    journeyId: string,
    priority: number,
    status: WeightedEscalationScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.visible = visible;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.sequence = sequence;
    this.timezone = timezone;
    this.variant = variant;
    this.journeyId = journeyId;
    this.priority = priority;
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

  canMoveTo(next: WeightedEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
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

  moveTo(next: WeightedEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted escalation schedule"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.graceDays * this.priority * 100) / 100;
  }

  copy(): WeightedEscalationSchedule {
    return new WeightedEscalationSchedule(
      this.code,
      this.label,
      this.title,
      this.visible,
      this.sendAt,
      this.graceDays,
      this.sequence,
      this.timezone,
      this.variant,
      this.journeyId,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted escalation schedule in status proposed. */
export function newWeightedEscalationSchedule(code: string, label: string): WeightedEscalationSchedule {
  return new WeightedEscalationSchedule(code, label, "", false, 0, 0, 0, "", "", "", 0, "proposed");
}
