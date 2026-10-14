import * as text from "../../../../kit/text.js";

/** Where a manual flight template is in its life cycle. */
export type ManualFlightTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual flight template. Its code is unique within a tenant. */
export class ManualFlightTemplate {
  code: string;
  title: string;
  channel: string;
  budget: number;
  cost: number;
  clicks: number;
  unit: string;
  windowDays: number;
  conversionRate: number;
  status: ManualFlightTemplateStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    budget: number,
    cost: number,
    clicks: number,
    unit: string,
    windowDays: number,
    conversionRate: number,
    status: ManualFlightTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.budget = budget;
    this.cost = cost;
    this.clicks = clicks;
    this.unit = unit;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: ManualFlightTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualFlightTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual flight template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedLoad(): number {
    return Math.round((this.cost + this.clicks) * 100) / 100;
  }

  copy(): ManualFlightTemplate {
    return new ManualFlightTemplate(
      this.code,
      this.title,
      this.channel,
      this.budget,
      this.cost,
      this.clicks,
      this.unit,
      this.windowDays,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual flight template in status planned. */
export function newManualFlightTemplate(code: string, title: string): ManualFlightTemplate {
  return new ManualFlightTemplate(code, title, "", 0, 0, 0, "", 0, 0, "planned");
}
