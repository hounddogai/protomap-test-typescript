import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule reservation is in its life cycle. */
export type TieredRewardRuleReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered reward rule reservation and its current status. */
export class TieredRewardRuleReservation {
  code: string;
  name: string;
  sequence: number;
  durationMinutes: number;
  contactEmail: string;
  label: string;
  audienceId: string;
  unit: string;
  cohort: string;
  timezone: string;
  threshold: number;
  status: TieredRewardRuleReservationStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    durationMinutes: number,
    contactEmail: string,
    label: string,
    audienceId: string,
    unit: string,
    cohort: string,
    timezone: string,
    threshold: number,
    status: TieredRewardRuleReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.label = label;
    this.audienceId = audienceId;
    this.unit = unit;
    this.cohort = cohort;
    this.timezone = timezone;
    this.threshold = threshold;
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

  canMoveTo(next: TieredRewardRuleReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardRuleReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered reward rule reservation"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.sequence * this.durationMinutes * 100) / 100;
  }

  copy(): TieredRewardRuleReservation {
    return new TieredRewardRuleReservation(
      this.code,
      this.name,
      this.sequence,
      this.durationMinutes,
      this.contactEmail,
      this.label,
      this.audienceId,
      this.unit,
      this.cohort,
      this.timezone,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered reward rule reservation in status proposed. */
export function newTieredRewardRuleReservation(code: string, name: string): TieredRewardRuleReservation {
  return new TieredRewardRuleReservation(code, name, 0, 0, "", "", "", "", "", "", 0, "proposed");
}
