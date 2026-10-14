import * as text from "../../../../kit/text.js";

/** Where a regional complaint draft is in its life cycle. */
export type RegionalComplaintDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional complaint draft. Its code is unique within a tenant. */
export class RegionalComplaintDraft {
  code: string;
  label: string;
  floorValue: number;
  notes: string;
  durationMinutes: number;
  phone: string;
  openRate: number;
  locale: string;
  timezone: string;
  priority: number;
  channel: string;
  status: RegionalComplaintDraftStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    notes: string,
    durationMinutes: number,
    phone: string,
    openRate: number,
    locale: string,
    timezone: string,
    priority: number,
    channel: string,
    status: RegionalComplaintDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.notes = notes;
    this.durationMinutes = durationMinutes;
    this.phone = phone;
    this.openRate = openRate;
    this.locale = locale;
    this.timezone = timezone;
    this.priority = priority;
    this.channel = channel;
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

  canMoveTo(next: RegionalComplaintDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalComplaintDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional complaint draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round(this.openRate * this.durationMinutes * 100) / 100;
  }

  copy(): RegionalComplaintDraft {
    return new RegionalComplaintDraft(
      this.code,
      this.label,
      this.floorValue,
      this.notes,
      this.durationMinutes,
      this.phone,
      this.openRate,
      this.locale,
      this.timezone,
      this.priority,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional complaint draft in status planned. */
export function newRegionalComplaintDraft(code: string, label: string): RegionalComplaintDraft {
  return new RegionalComplaintDraft(code, label, 0, "", 0, "", 0, "", "", 0, "", "planned");
}
