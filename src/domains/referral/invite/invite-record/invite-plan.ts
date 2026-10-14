import * as text from "../../../../kit/text.js";

/** Where a invite plan is in its life cycle. */
export type InvitePlanStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a invite plan and its current status. */
export class InvitePlan {
  code: string;
  title: string;
  unit: string;
  sequence: number;
  timezone: string;
  variant: string;
  frequencyCap: number;
  budget: number;
  windowDays: number;
  audienceId: string;
  cohort: string;
  status: InvitePlanStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    sequence: number,
    timezone: string,
    variant: string,
    frequencyCap: number,
    budget: number,
    windowDays: number,
    audienceId: string,
    cohort: string,
    status: InvitePlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.sequence = sequence;
    this.timezone = timezone;
    this.variant = variant;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.windowDays = windowDays;
    this.audienceId = audienceId;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InvitePlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InvitePlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.budget * this.frequencyCap * 100) / 100;
  }

  copy(): InvitePlan {
    return new InvitePlan(
      this.code,
      this.title,
      this.unit,
      this.sequence,
      this.timezone,
      this.variant,
      this.frequencyCap,
      this.budget,
      this.windowDays,
      this.audienceId,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a invite plan in status requested. */
export function newInvitePlan(code: string, title: string): InvitePlan {
  return new InvitePlan(code, title, "", 0, "", "", 0, 0, 0, "", "", "requested");
}
