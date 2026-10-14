import * as text from "../../../../kit/text.js";

/** Where a weighted deflection schedule is in its life cycle. */
export type WeightedDeflectionScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted deflection schedule, with what the planners need to act on it. */
export class WeightedDeflectionSchedule {
  code: string;
  title: string;
  amount: number;
  graceDays: number;
  impressions: number;
  phone: string;
  openRate: number;
  capacity: number;
  journeyId: string;
  audienceId: string;
  status: WeightedDeflectionScheduleStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    graceDays: number,
    impressions: number,
    phone: string,
    openRate: number,
    capacity: number,
    journeyId: string,
    audienceId: string,
    status: WeightedDeflectionScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.graceDays = graceDays;
    this.impressions = impressions;
    this.phone = phone;
    this.openRate = openRate;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedDeflectionScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WeightedDeflectionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted deflection schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted deflection schedule"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.openRate * this.impressions * 100) / 100;
  }

  copy(): WeightedDeflectionSchedule {
    return new WeightedDeflectionSchedule(
      this.code,
      this.title,
      this.amount,
      this.graceDays,
      this.impressions,
      this.phone,
      this.openRate,
      this.capacity,
      this.journeyId,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted deflection schedule in status requested. */
export function newWeightedDeflectionSchedule(code: string, title: string): WeightedDeflectionSchedule {
  return new WeightedDeflectionSchedule(code, title, 0, 0, 0, "", 0, 0, "", "", "requested");
}
