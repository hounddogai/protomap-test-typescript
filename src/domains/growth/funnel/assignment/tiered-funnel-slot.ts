import * as text from "../../../../kit/text.js";

/** Where a tiered funnel slot is in its life cycle. */
export type TieredFunnelSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered funnel slot and its current status. */
export class TieredFunnelSlot {
  code: string;
  title: string;
  retries: number;
  impressions: number;
  pinned: boolean;
  windowDays: number;
  openRate: number;
  unit: string;
  status: TieredFunnelSlotStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    impressions: number,
    pinned: boolean,
    windowDays: number,
    openRate: number,
    unit: string,
    status: TieredFunnelSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.impressions = impressions;
    this.pinned = pinned;
    this.windowDays = windowDays;
    this.openRate = openRate;
    this.unit = unit;
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

  canMoveTo(next: TieredFunnelSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFunnelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered funnel slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions + this.windowDays) * 100) / 100;
  }

  copy(): TieredFunnelSlot {
    return new TieredFunnelSlot(
      this.code,
      this.title,
      this.retries,
      this.impressions,
      this.pinned,
      this.windowDays,
      this.openRate,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered funnel slot in status open. */
export function newTieredFunnelSlot(code: string, title: string): TieredFunnelSlot {
  return new TieredFunnelSlot(code, title, 0, 0, false, 0, 0, "", "open");
}
