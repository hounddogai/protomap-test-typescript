import * as text from "../../../../kit/text.js";

/** Where a manual sla plan is in its life cycle. */
export type ManualSlaPlanStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual sla plan and its current status. */
export class ManualSlaPlan {
  code: string;
  label: string;
  reviewer: string;
  expiresAt: number;
  name: string;
  impressions: number;
  channel: string;
  title: string;
  contactEmail: string;
  active: boolean;
  status: ManualSlaPlanStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    expiresAt: number,
    name: string,
    impressions: number,
    channel: string,
    title: string,
    contactEmail: string,
    active: boolean,
    status: ManualSlaPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.name = name;
    this.impressions = impressions;
    this.channel = channel;
    this.title = title;
    this.contactEmail = contactEmail;
    this.active = active;
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

  canMoveTo(next: ManualSlaPlanStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: ManualSlaPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual sla plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.expiresAt - this.impressions) * 100) / 100;
  }

  copy(): ManualSlaPlan {
    return new ManualSlaPlan(
      this.code,
      this.label,
      this.reviewer,
      this.expiresAt,
      this.name,
      this.impressions,
      this.channel,
      this.title,
      this.contactEmail,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual sla plan in status planned. */
export function newManualSlaPlan(code: string, label: string): ManualSlaPlan {
  return new ManualSlaPlan(code, label, "", 0, "", 0, "", "", "", false, "planned");
}
