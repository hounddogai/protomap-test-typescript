import * as text from "../../../../kit/text.js";

/** Where a legacy funnel schedule is in its life cycle. */
export type LegacyFunnelScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy funnel schedule as the funnel team keeps it. */
export class LegacyFunnelSchedule {
  code: string;
  title: string;
  batchSize: number;
  name: string;
  clicks: number;
  priority: number;
  graceDays: number;
  status: LegacyFunnelScheduleStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    name: string,
    clicks: number,
    priority: number,
    graceDays: number,
    status: LegacyFunnelScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.name = name;
    this.clicks = clicks;
    this.priority = priority;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyFunnelScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFunnelScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy funnel schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round(this.graceDays * this.priority * 100) / 100;
  }

  copy(): LegacyFunnelSchedule {
    return new LegacyFunnelSchedule(
      this.code,
      this.title,
      this.batchSize,
      this.name,
      this.clicks,
      this.priority,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy funnel schedule in status requested. */
export function newLegacyFunnelSchedule(code: string, title: string): LegacyFunnelSchedule {
  return new LegacyFunnelSchedule(code, title, 0, "", 0, 0, 0, "requested");
}
