import * as text from "../../../../kit/text.js";

/** Where a regional conversion schedule is in its life cycle. */
export type RegionalConversionScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a regional conversion schedule and its current status. */
export class RegionalConversionSchedule {
  code: string;
  name: string;
  bid: number;
  retries: number;
  title: string;
  approved: boolean;
  tags: string[];
  locale: string;
  country: string;
  variant: string;
  summary: string;
  status: RegionalConversionScheduleStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    retries: number,
    title: string,
    approved: boolean,
    tags: string[],
    locale: string,
    country: string,
    variant: string,
    summary: string,
    status: RegionalConversionScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.retries = retries;
    this.title = title;
    this.approved = approved;
    this.tags = tags;
    this.locale = locale;
    this.country = country;
    this.variant = variant;
    this.summary = summary;
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

  canMoveTo(next: RegionalConversionScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalConversionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional conversion schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round(this.bid * this.retries * 100) / 100;
  }

  copy(): RegionalConversionSchedule {
    return new RegionalConversionSchedule(
      this.code,
      this.name,
      this.bid,
      this.retries,
      this.title,
      this.approved,
      this.tags,
      this.locale,
      this.country,
      this.variant,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional conversion schedule in status draft. */
export function newRegionalConversionSchedule(code: string, name: string): RegionalConversionSchedule {
  return new RegionalConversionSchedule(code, name, 0, 0, "", false, [], "", "", "", "", "draft");
}
