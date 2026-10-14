/**
 * The weighted approval schedule records of social's approval work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted approval schedule is in its life cycle. */
export type WeightedApprovalScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted approval schedule, with what the planners need to act on it. */
export class WeightedApprovalSchedule {
  code: string;
  name: string;
  discount: number;
  endsAt: number;
  frequencyCap: number;
  notes: string;
  amount: number;
  ratio: number;
  campaignRef: string;
  cohort: string;
  active: boolean;
  status: WeightedApprovalScheduleStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    endsAt: number,
    frequencyCap: number,
    notes: string,
    amount: number,
    ratio: number,
    campaignRef: string,
    cohort: string,
    active: boolean,
    status: WeightedApprovalScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.amount = amount;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.active = active;
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

  canMoveTo(next: WeightedApprovalScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
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

  moveTo(next: WeightedApprovalScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted approval schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round(this.endsAt * this.amount * 100) / 100;
  }

  copy(): WeightedApprovalSchedule {
    return new WeightedApprovalSchedule(
      this.code,
      this.name,
      this.discount,
      this.endsAt,
      this.frequencyCap,
      this.notes,
      this.amount,
      this.ratio,
      this.campaignRef,
      this.cohort,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a weighted approval schedule in status proposed. */
export function newWeightedApprovalSchedule(code: string, name: string): WeightedApprovalSchedule {
  return new WeightedApprovalSchedule(code, name, 0, 0, 0, "", 0, 0, "", "", false, "proposed");
}
