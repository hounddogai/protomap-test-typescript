import * as text from "../../../../kit/text.js";

/** Where a rolling post slot is in its life cycle. */
export type RollingPostSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One rolling post slot, with what the planners need to act on it. */
export class RollingPostSlot {
  code: string;
  name: string;
  updatedAt: number;
  ownerId: string;
  segment: string;
  externalRef: string;
  sequence: number;
  attempts: number;
  impressions: number;
  priority: number;
  createdAt: number;
  status: RollingPostSlotStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    ownerId: string,
    segment: string,
    externalRef: string,
    sequence: number,
    attempts: number,
    impressions: number,
    priority: number,
    createdAt: number,
    status: RollingPostSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.segment = segment;
    this.externalRef = externalRef;
    this.sequence = sequence;
    this.attempts = attempts;
    this.impressions = impressions;
    this.priority = priority;
    this.createdAt = createdAt;
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

  canMoveTo(next: RollingPostSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPostSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling post slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.createdAt + this.sequence) * 100) / 100;
  }

  copy(): RollingPostSlot {
    return new RollingPostSlot(
      this.code,
      this.name,
      this.updatedAt,
      this.ownerId,
      this.segment,
      this.externalRef,
      this.sequence,
      this.attempts,
      this.impressions,
      this.priority,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling post slot in status proposed. */
export function newRollingPostSlot(code: string, name: string): RollingPostSlot {
  return new RollingPostSlot(code, name, 0, "", "", "", 0, 0, 0, 0, 0, "proposed");
}
