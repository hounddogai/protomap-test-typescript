import * as text from "../../../../kit/text.js";

/** Where a regional frequency allocation is in its life cycle. */
export type RegionalFrequencyAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional frequency allocation as the frequency team keeps it. */
export class RegionalFrequencyAllocation {
  code: string;
  title: string;
  timezone: string;
  name: string;
  clicks: number;
  frequencyCap: number;
  phone: string;
  region: string;
  contactEmail: string;
  channel: string;
  windowDays: number;
  status: RegionalFrequencyAllocationStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    name: string,
    clicks: number,
    frequencyCap: number,
    phone: string,
    region: string,
    contactEmail: string,
    channel: string,
    windowDays: number,
    status: RegionalFrequencyAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.name = name;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.phone = phone;
    this.region = region;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.windowDays = windowDays;
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

  canMoveTo(next: RegionalFrequencyAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalFrequencyAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional frequency allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.windowDays + this.clicks) * 100) / 100;
  }

  copy(): RegionalFrequencyAllocation {
    return new RegionalFrequencyAllocation(
      this.code,
      this.title,
      this.timezone,
      this.name,
      this.clicks,
      this.frequencyCap,
      this.phone,
      this.region,
      this.contactEmail,
      this.channel,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional frequency allocation in status new. */
export function newRegionalFrequencyAllocation(code: string, title: string): RegionalFrequencyAllocation {
  return new RegionalFrequencyAllocation(code, title, "", "", 0, 0, "", "", "", "", 0, "new");
}
