import * as text from "../../../../kit/text.js";

/** Where a manual invite checkpoint is in its life cycle. */
export type ManualInviteCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual invite checkpoint as the invite team keeps it. */
export class ManualInviteCheckpoint {
  code: string;
  label: string;
  unit: string;
  locale: string;
  country: string;
  capacity: number;
  summary: string;
  phone: string;
  segment: string;
  updatedAt: number;
  status: ManualInviteCheckpointStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    locale: string,
    country: string,
    capacity: number,
    summary: string,
    phone: string,
    segment: string,
    updatedAt: number,
    status: ManualInviteCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.locale = locale;
    this.country = country;
    this.capacity = capacity;
    this.summary = summary;
    this.phone = phone;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualInviteCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualInviteCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual invite checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual invite checkpoint"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.updatedAt * this.capacity * 100) / 100;
  }

  copy(): ManualInviteCheckpoint {
    return new ManualInviteCheckpoint(
      this.code,
      this.label,
      this.unit,
      this.locale,
      this.country,
      this.capacity,
      this.summary,
      this.phone,
      this.segment,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a manual invite checkpoint in status open. */
export function newManualInviteCheckpoint(code: string, label: string): ManualInviteCheckpoint {
  return new ManualInviteCheckpoint(code, label, "", "", "", 0, "", "", "", 0, "open");
}
