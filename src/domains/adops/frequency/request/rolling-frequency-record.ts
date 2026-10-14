import * as text from "../../../../kit/text.js";

/** Where a rolling frequency record is in its life cycle. */
export type RollingFrequencyRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling frequency record. Its code is unique within a tenant. */
export class RollingFrequencyRecord {
  code: string;
  label: string;
  startsAt: number;
  impressions: number;
  timezone: string;
  locale: string;
  quantity: number;
  margin: number;
  name: string;
  tags: string[];
  audienceId: string;
  status: RollingFrequencyRecordStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    impressions: number,
    timezone: string,
    locale: string,
    quantity: number,
    margin: number,
    name: string,
    tags: string[],
    audienceId: string,
    status: RollingFrequencyRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.impressions = impressions;
    this.timezone = timezone;
    this.locale = locale;
    this.quantity = quantity;
    this.margin = margin;
    this.name = name;
    this.tags = tags;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingFrequencyRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingFrequencyRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling frequency record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
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

  netValue(): number {
    return Math.round(this.quantity * this.startsAt * 100) / 100;
  }

  copy(): RollingFrequencyRecord {
    return new RollingFrequencyRecord(
      this.code,
      this.label,
      this.startsAt,
      this.impressions,
      this.timezone,
      this.locale,
      this.quantity,
      this.margin,
      this.name,
      this.tags,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling frequency record in status draft. */
export function newRollingFrequencyRecord(code: string, label: string): RollingFrequencyRecord {
  return new RollingFrequencyRecord(code, label, 0, 0, "", "", 0, 0, "", [], "", "draft");
}
