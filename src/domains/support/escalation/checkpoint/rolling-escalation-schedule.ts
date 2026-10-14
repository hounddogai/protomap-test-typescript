import * as text from "../../../../kit/text.js";

/** Where a rolling escalation schedule is in its life cycle. */
export type RollingEscalationScheduleStatus = "created" | "validated" | "published" | "retired";

/** A rolling escalation schedule as the escalation team keeps it. */
export class RollingEscalationSchedule {
  code: string;
  label: string;
  phone: string;
  tags: string[];
  ownerId: string;
  campaignRef: string;
  endsAt: number;
  conversionRate: number;
  sequence: number;
  status: RollingEscalationScheduleStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    tags: string[],
    ownerId: string,
    campaignRef: string,
    endsAt: number,
    conversionRate: number,
    sequence: number,
    status: RollingEscalationScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.tags = tags;
    this.ownerId = ownerId;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.sequence * this.endsAt * 100) / 100;
  }

  copy(): RollingEscalationSchedule {
    return new RollingEscalationSchedule(
      this.code,
      this.label,
      this.phone,
      this.tags,
      this.ownerId,
      this.campaignRef,
      this.endsAt,
      this.conversionRate,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling escalation schedule in status created. */
export function newRollingEscalationSchedule(code: string, label: string): RollingEscalationSchedule {
  return new RollingEscalationSchedule(code, label, "", [], "", "", 0, 0, 0, "created");
}
