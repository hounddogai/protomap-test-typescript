import * as text from "../../../../kit/text.js";

/** Where a regional streak schedule is in its life cycle. */
export type RegionalStreakScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a regional streak schedule and its current status. */
export class RegionalStreakSchedule {
  code: string;
  label: string;
  archived: boolean;
  quantity: number;
  weight: number;
  sendAt: number;
  approved: boolean;
  campaignRef: string;
  attributes: Map<string, string>;
  audienceId: string;
  version: number;
  status: RegionalStreakScheduleStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    quantity: number,
    weight: number,
    sendAt: number,
    approved: boolean,
    campaignRef: string,
    attributes: Map<string, string>,
    audienceId: string,
    version: number,
    status: RegionalStreakScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.quantity = quantity;
    this.weight = weight;
    this.sendAt = sendAt;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.attributes = attributes;
    this.audienceId = audienceId;
    this.version = version;
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

  canMoveTo(next: RegionalStreakScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalStreakScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.version + this.weight) * 100) / 100;
  }

  copy(): RegionalStreakSchedule {
    return new RegionalStreakSchedule(
      this.code,
      this.label,
      this.archived,
      this.quantity,
      this.weight,
      this.sendAt,
      this.approved,
      this.campaignRef,
      this.attributes,
      this.audienceId,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional streak schedule in status idle. */
export function newRegionalStreakSchedule(code: string, label: string): RegionalStreakSchedule {
  return new RegionalStreakSchedule(code, label, false, 0, 0, 0, false, "", new Map<string, string>(), "", 0, "idle");
}
