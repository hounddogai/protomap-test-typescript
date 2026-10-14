import * as text from "../../../../kit/text.js";

/** Where a tiered queue group is in its life cycle. */
export type TieredQueueGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered queue group as the queue team keeps it. */
export class TieredQueueGroup {
  code: string;
  label: string;
  budget: number;
  title: string;
  rate: number;
  openRate: number;
  locale: string;
  ceiling: number;
  status: TieredQueueGroupStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    title: string,
    rate: number,
    openRate: number,
    locale: string,
    ceiling: number,
    status: TieredQueueGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.title = title;
    this.rate = rate;
    this.openRate = openRate;
    this.locale = locale;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredQueueGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredQueueGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered queue group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered queue group"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.ceiling * this.budget * 100) / 100;
  }

  copy(): TieredQueueGroup {
    return new TieredQueueGroup(
      this.code,
      this.label,
      this.budget,
      this.title,
      this.rate,
      this.openRate,
      this.locale,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered queue group in status idle. */
export function newTieredQueueGroup(code: string, label: string): TieredQueueGroup {
  return new TieredQueueGroup(code, label, 0, "", 0, 0, "", 0, "idle");
}
