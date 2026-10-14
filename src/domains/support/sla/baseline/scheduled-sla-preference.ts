import * as text from "../../../../kit/text.js";

/** Where a scheduled sla preference is in its life cycle. */
export type ScheduledSlaPreferenceStatus = "created" | "validated" | "published" | "retired";

/** One scheduled sla preference, with what the planners need to act on it. */
export class ScheduledSlaPreference {
  code: string;
  name: string;
  threshold: number;
  approved: boolean;
  utmSource: string;
  amount: number;
  contactEmail: string;
  notes: string;
  margin: number;
  version: number;
  rate: number;
  status: ScheduledSlaPreferenceStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    approved: boolean,
    utmSource: string,
    amount: number,
    contactEmail: string,
    notes: string,
    margin: number,
    version: number,
    rate: number,
    status: ScheduledSlaPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.approved = approved;
    this.utmSource = utmSource;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.margin = margin;
    this.version = version;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledSlaPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledSlaPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sla preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round(this.threshold * this.margin * 100) / 100;
  }

  copy(): ScheduledSlaPreference {
    return new ScheduledSlaPreference(
      this.code,
      this.name,
      this.threshold,
      this.approved,
      this.utmSource,
      this.amount,
      this.contactEmail,
      this.notes,
      this.margin,
      this.version,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled sla preference in status created. */
export function newScheduledSlaPreference(code: string, name: string): ScheduledSlaPreference {
  return new ScheduledSlaPreference(code, name, 0, false, "", 0, "", "", 0, 0, 0, "created");
}
