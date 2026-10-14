import * as text from "../../../../kit/text.js";

/** Where a strict proof schedule is in its life cycle. */
export type StrictProofScheduleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict proof schedule and its current status. */
export class StrictProofSchedule {
  code: string;
  label: string;
  region: string;
  active: boolean;
  channel: string;
  category: string;
  openRate: number;
  margin: number;
  conversionRate: number;
  campaignRef: string;
  batchSize: number;
  status: StrictProofScheduleStatus;

  constructor(
    code: string,
    label: string,
    region: string,
    active: boolean,
    channel: string,
    category: string,
    openRate: number,
    margin: number,
    conversionRate: number,
    campaignRef: string,
    batchSize: number,
    status: StrictProofScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.region = region;
    this.active = active;
    this.channel = channel;
    this.category = category;
    this.openRate = openRate;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictProofScheduleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictProofScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict proof schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round((this.openRate - this.margin) * 100) / 100;
  }

  copy(): StrictProofSchedule {
    return new StrictProofSchedule(
      this.code,
      this.label,
      this.region,
      this.active,
      this.channel,
      this.category,
      this.openRate,
      this.margin,
      this.conversionRate,
      this.campaignRef,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict proof schedule in status new. */
export function newStrictProofSchedule(code: string, label: string): StrictProofSchedule {
  return new StrictProofSchedule(code, label, "", false, "", "", 0, 0, 0, "", 0, "new");
}
