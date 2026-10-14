import * as text from "../../../../kit/text.js";

/** Where a weighted ticket view override is in its life cycle. */
export type WeightedTicketViewOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted ticket view override and its current status. */
export class WeightedTicketViewOverride {
  code: string;
  label: string;
  clicks: number;
  timezone: string;
  windowDays: number;
  channel: string;
  category: string;
  status: WeightedTicketViewOverrideStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    timezone: string,
    windowDays: number,
    channel: string,
    category: string,
    status: WeightedTicketViewOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.channel = channel;
    this.category = category;
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

  canMoveTo(next: WeightedTicketViewOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTicketViewOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted ticket view override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedExposure(): number {
    return Math.round((this.clicks + this.windowDays) * 100) / 100;
  }

  copy(): WeightedTicketViewOverride {
    return new WeightedTicketViewOverride(
      this.code,
      this.label,
      this.clicks,
      this.timezone,
      this.windowDays,
      this.channel,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted ticket view override in status planned. */
export function newWeightedTicketViewOverride(code: string, label: string): WeightedTicketViewOverride {
  return new WeightedTicketViewOverride(code, label, 0, "", 0, "", "", "planned");
}
