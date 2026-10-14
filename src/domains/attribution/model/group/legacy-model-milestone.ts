import * as text from "../../../../kit/text.js";

/** Where a legacy model milestone is in its life cycle. */
export type LegacyModelMilestoneStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy model milestone. Its code is unique within a tenant. */
export class LegacyModelMilestone {
  code: string;
  name: string;
  channel: string;
  checksum: string;
  conversionRate: number;
  durationMinutes: number;
  journeyId: string;
  phone: string;
  status: LegacyModelMilestoneStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    checksum: string,
    conversionRate: number,
    durationMinutes: number,
    journeyId: string,
    phone: string,
    status: LegacyModelMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.phone = phone;
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

  canMoveTo(next: LegacyModelMilestoneStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyModelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy model milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate - this.durationMinutes) * 100) / 100;
  }

  copy(): LegacyModelMilestone {
    return new LegacyModelMilestone(
      this.code,
      this.name,
      this.channel,
      this.checksum,
      this.conversionRate,
      this.durationMinutes,
      this.journeyId,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy model milestone in status idle. */
export function newLegacyModelMilestone(code: string, name: string): LegacyModelMilestone {
  return new LegacyModelMilestone(code, name, "", "", 0, 0, "", "", "idle");
}
