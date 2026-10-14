import * as text from "../../../../kit/text.js";

/** Where a legacy escalation schedule is in its life cycle. */
export type LegacyEscalationScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy escalation schedule as the escalation team keeps it. */
export class LegacyEscalationSchedule {
  code: string;
  name: string;
  endsAt: number;
  reviewer: string;
  expiresAt: number;
  audienceId: string;
  weight: number;
  startsAt: number;
  priority: number;
  category: string;
  pinned: boolean;
  status: LegacyEscalationScheduleStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    reviewer: string,
    expiresAt: number,
    audienceId: string,
    weight: number,
    startsAt: number,
    priority: number,
    category: string,
    pinned: boolean,
    status: LegacyEscalationScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.audienceId = audienceId;
    this.weight = weight;
    this.startsAt = startsAt;
    this.priority = priority;
    this.category = category;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyEscalationScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyEscalationScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy escalation schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.priority - this.weight) * 100) / 100;
  }

  copy(): LegacyEscalationSchedule {
    return new LegacyEscalationSchedule(
      this.code,
      this.name,
      this.endsAt,
      this.reviewer,
      this.expiresAt,
      this.audienceId,
      this.weight,
      this.startsAt,
      this.priority,
      this.category,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy escalation schedule in status draft. */
export function newLegacyEscalationSchedule(code: string, name: string): LegacyEscalationSchedule {
  return new LegacyEscalationSchedule(code, name, 0, "", 0, "", 0, 0, 0, "", false, "draft");
}
