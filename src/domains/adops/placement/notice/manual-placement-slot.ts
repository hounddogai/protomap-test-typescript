import * as text from "../../../../kit/text.js";

/** Where a manual placement slot is in its life cycle. */
export type ManualPlacementSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One manual placement slot, with what the planners need to act on it. */
export class ManualPlacementSlot {
  code: string;
  name: string;
  startsAt: number;
  openRate: number;
  timezone: string;
  locale: string;
  maximum: number;
  quantity: number;
  budget: number;
  source: string;
  clicks: number;
  status: ManualPlacementSlotStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    openRate: number,
    timezone: string,
    locale: string,
    maximum: number,
    quantity: number,
    budget: number,
    source: string,
    clicks: number,
    status: ManualPlacementSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.timezone = timezone;
    this.locale = locale;
    this.maximum = maximum;
    this.quantity = quantity;
    this.budget = budget;
    this.source = source;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualPlacementSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.openRate + this.clicks) * 100) / 100;
  }

  copy(): ManualPlacementSlot {
    return new ManualPlacementSlot(
      this.code,
      this.name,
      this.startsAt,
      this.openRate,
      this.timezone,
      this.locale,
      this.maximum,
      this.quantity,
      this.budget,
      this.source,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual placement slot in status open. */
export function newManualPlacementSlot(code: string, name: string): ManualPlacementSlot {
  return new ManualPlacementSlot(code, name, 0, 0, "", "", 0, 0, 0, "", 0, "open");
}
