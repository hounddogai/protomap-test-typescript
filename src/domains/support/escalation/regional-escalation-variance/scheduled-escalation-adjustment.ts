import * as text from "../../../../kit/text.js";

/** Where a scheduled escalation adjustment is in its life cycle. */
export type ScheduledEscalationAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A scheduled escalation adjustment. Its code is unique within a tenant. */
export class ScheduledEscalationAdjustment {
  code: string;
  name: string;
  score: number;
  campaignRef: string;
  pinned: boolean;
  ownerId: string;
  status: ScheduledEscalationAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    campaignRef: string,
    pinned: boolean,
    ownerId: string,
    status: ScheduledEscalationAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.ownerId = ownerId;
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

  canMoveTo(next: ScheduledEscalationAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledEscalationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled escalation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledEscalationAdjustment {
    return new ScheduledEscalationAdjustment(
      this.code,
      this.name,
      this.score,
      this.campaignRef,
      this.pinned,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled escalation adjustment in status created. */
export function newScheduledEscalationAdjustment(code: string, name: string): ScheduledEscalationAdjustment {
  return new ScheduledEscalationAdjustment(code, name, 0, "", false, "", "created");
}
