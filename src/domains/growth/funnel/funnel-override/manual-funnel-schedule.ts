import * as text from "../../../../kit/text.js";

/** Where a manual funnel schedule is in its life cycle. */
export type ManualFunnelScheduleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual funnel schedule as the funnel team keeps it. */
export class ManualFunnelSchedule {
  code: string;
  label: string;
  campaignRef: string;
  capacity: number;
  tags: string[];
  journeyId: string;
  status: ManualFunnelScheduleStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    capacity: number,
    tags: string[],
    journeyId: string,
    status: ManualFunnelScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.tags = tags;
    this.journeyId = journeyId;
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

  canMoveTo(next: ManualFunnelScheduleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualFunnelScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual funnel schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): ManualFunnelSchedule {
    return new ManualFunnelSchedule(
      this.code,
      this.label,
      this.campaignRef,
      this.capacity,
      this.tags,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual funnel schedule in status proposed. */
export function newManualFunnelSchedule(code: string, label: string): ManualFunnelSchedule {
  return new ManualFunnelSchedule(code, label, "", 0, [], "", "proposed");
}
