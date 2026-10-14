import * as text from "../../../../kit/text.js";

/** Where a lenient cohort schedule is in its life cycle. */
export type LenientCohortScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient cohort schedule. Its code is unique within a tenant. */
export class LenientCohortSchedule {
  code: string;
  label: string;
  impressions: number;
  frequencyCap: number;
  budget: number;
  externalRef: string;
  channel: string;
  revision: number;
  endsAt: number;
  status: LenientCohortScheduleStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    frequencyCap: number,
    budget: number,
    externalRef: string,
    channel: string,
    revision: number,
    endsAt: number,
    status: LenientCohortScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.externalRef = externalRef;
    this.channel = channel;
    this.revision = revision;
    this.endsAt = endsAt;
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

  canMoveTo(next: LenientCohortScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: LenientCohortScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient cohort schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.endsAt * this.frequencyCap * 100) / 100;
  }

  copy(): LenientCohortSchedule {
    return new LenientCohortSchedule(
      this.code,
      this.label,
      this.impressions,
      this.frequencyCap,
      this.budget,
      this.externalRef,
      this.channel,
      this.revision,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient cohort schedule in status idle. */
export function newLenientCohortSchedule(code: string, label: string): LenientCohortSchedule {
  return new LenientCohortSchedule(code, label, 0, 0, 0, "", "", 0, 0, "idle");
}
