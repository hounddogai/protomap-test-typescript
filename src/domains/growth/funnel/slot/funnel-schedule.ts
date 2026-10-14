import * as text from "../../../../kit/text.js";

/** Where a funnel schedule is in its life cycle. */
export type FunnelScheduleStatus = "created" | "validated" | "published" | "retired";

/** A funnel schedule. Its code is unique within a tenant. */
export class FunnelSchedule {
  code: string;
  title: string;
  utmSource: string;
  country: string;
  graceDays: number;
  clicks: number;
  floorValue: number;
  status: FunnelScheduleStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    country: string,
    graceDays: number,
    clicks: number,
    floorValue: number,
    status: FunnelScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.country = country;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.floorValue = floorValue;
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

  canMoveTo(next: FunnelScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.clicks + this.graceDays) * 100) / 100;
  }

  copy(): FunnelSchedule {
    return new FunnelSchedule(
      this.code,
      this.title,
      this.utmSource,
      this.country,
      this.graceDays,
      this.clicks,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a funnel schedule in status created. */
export function newFunnelSchedule(code: string, title: string): FunnelSchedule {
  return new FunnelSchedule(code, title, "", "", 0, 0, 0, "created");
}
