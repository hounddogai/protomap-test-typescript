import * as text from "../../../../kit/text.js";

/** Where a regional creative record is in its life cycle. */
export type RegionalCreativeRecordStatus = "created" | "validated" | "published" | "retired";

/** A regional creative record as the creative team keeps it. */
export class RegionalCreativeRecord {
  code: string;
  label: string;
  createdAt: number;
  journeyId: string;
  durationMinutes: number;
  locale: string;
  category: string;
  ratio: number;
  contactEmail: string;
  segment: string;
  rate: number;
  status: RegionalCreativeRecordStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    journeyId: string,
    durationMinutes: number,
    locale: string,
    category: string,
    ratio: number,
    contactEmail: string,
    segment: string,
    rate: number,
    status: RegionalCreativeRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.category = category;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.segment = segment;
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

  canMoveTo(next: RegionalCreativeRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCreativeRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional creative record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveVolume(): number {
    return Math.round((this.ratio - this.rate) * 100) / 100;
  }

  copy(): RegionalCreativeRecord {
    return new RegionalCreativeRecord(
      this.code,
      this.label,
      this.createdAt,
      this.journeyId,
      this.durationMinutes,
      this.locale,
      this.category,
      this.ratio,
      this.contactEmail,
      this.segment,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional creative record in status created. */
export function newRegionalCreativeRecord(code: string, label: string): RegionalCreativeRecord {
  return new RegionalCreativeRecord(code, label, 0, "", 0, "", "", 0, "", "", 0, "created");
}
