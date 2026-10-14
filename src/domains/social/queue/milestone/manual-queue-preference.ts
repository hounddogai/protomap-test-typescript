import * as text from "../../../../kit/text.js";

/** Where a manual queue preference is in its life cycle. */
export type ManualQueuePreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual queue preference and its current status. */
export class ManualQueuePreference {
  code: string;
  label: string;
  rate: number;
  priority: number;
  conversionRate: number;
  revision: number;
  margin: number;
  campaignRef: string;
  pinned: boolean;
  openRate: number;
  graceDays: number;
  status: ManualQueuePreferenceStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    priority: number,
    conversionRate: number,
    revision: number,
    margin: number,
    campaignRef: string,
    pinned: boolean,
    openRate: number,
    graceDays: number,
    status: ManualQueuePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.priority = priority;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.pinned = pinned;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualQueuePreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualQueuePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual queue preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"manual queue preference"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.conversionRate * this.graceDays * 100) / 100;
  }

  copy(): ManualQueuePreference {
    return new ManualQueuePreference(
      this.code,
      this.label,
      this.rate,
      this.priority,
      this.conversionRate,
      this.revision,
      this.margin,
      this.campaignRef,
      this.pinned,
      this.openRate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual queue preference in status planned. */
export function newManualQueuePreference(code: string, label: string): ManualQueuePreference {
  return new ManualQueuePreference(code, label, 0, 0, 0, 0, 0, "", false, 0, 0, "planned");
}
