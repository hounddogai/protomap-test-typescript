import * as text from "../../../../kit/text.js";

/** Where a legacy preference schedule is in its life cycle. */
export type LegacyPreferenceScheduleStatus = "created" | "validated" | "published" | "retired";

/** A legacy preference schedule. Its code is unique within a tenant. */
export class LegacyPreferenceSchedule {
  code: string;
  name: string;
  title: string;
  startsAt: number;
  channel: string;
  threshold: number;
  cost: number;
  discount: number;
  externalRef: string;
  status: LegacyPreferenceScheduleStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    startsAt: number,
    channel: string,
    threshold: number,
    cost: number,
    discount: number,
    externalRef: string,
    status: LegacyPreferenceScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.startsAt = startsAt;
    this.channel = channel;
    this.threshold = threshold;
    this.cost = cost;
    this.discount = discount;
    this.externalRef = externalRef;
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

  canMoveTo(next: LegacyPreferenceScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyPreferenceScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy preference schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.discount * this.cost * 100) / 100;
  }

  copy(): LegacyPreferenceSchedule {
    return new LegacyPreferenceSchedule(
      this.code,
      this.name,
      this.title,
      this.startsAt,
      this.channel,
      this.threshold,
      this.cost,
      this.discount,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy preference schedule in status created. */
export function newLegacyPreferenceSchedule(code: string, name: string): LegacyPreferenceSchedule {
  return new LegacyPreferenceSchedule(code, name, "", 0, "", 0, 0, 0, "", "created");
}
