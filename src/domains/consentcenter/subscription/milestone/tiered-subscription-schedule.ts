import * as text from "../../../../kit/text.js";

/** Where a tiered subscription schedule is in its life cycle. */
export type TieredSubscriptionScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered subscription schedule, with what the planners need to act on it. */
export class TieredSubscriptionSchedule {
  code: string;
  label: string;
  frequencyCap: number;
  timezone: string;
  attributes: Map<string, string>;
  discount: number;
  margin: number;
  sendAt: number;
  openRate: number;
  quantity: number;
  maximum: number;
  status: TieredSubscriptionScheduleStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    timezone: string,
    attributes: Map<string, string>,
    discount: number,
    margin: number,
    sendAt: number,
    openRate: number,
    quantity: number,
    maximum: number,
    status: TieredSubscriptionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.attributes = attributes;
    this.discount = discount;
    this.margin = margin;
    this.sendAt = sendAt;
    this.openRate = openRate;
    this.quantity = quantity;
    this.maximum = maximum;
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

  canMoveTo(next: TieredSubscriptionScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSubscriptionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered subscription schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.discount * this.margin * 100) / 100;
  }

  copy(): TieredSubscriptionSchedule {
    return new TieredSubscriptionSchedule(
      this.code,
      this.label,
      this.frequencyCap,
      this.timezone,
      this.attributes,
      this.discount,
      this.margin,
      this.sendAt,
      this.openRate,
      this.quantity,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered subscription schedule in status planned. */
export function newTieredSubscriptionSchedule(code: string, label: string): TieredSubscriptionSchedule {
  return new TieredSubscriptionSchedule(code, label, 0, "", new Map<string, string>(), 0, 0, 0, 0, 0, 0, "planned");
}
