import * as text from "../../../../kit/text.js";

/** Where a tiered post window is in its life cycle. */
export type TieredPostWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered post window, with what the planners need to act on it. */
export class TieredPostWindow {
  code: string;
  name: string;
  category: string;
  bid: number;
  createdAt: number;
  cohort: string;
  summary: string;
  timezone: string;
  quantity: number;
  status: TieredPostWindowStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    bid: number,
    createdAt: number,
    cohort: string,
    summary: string,
    timezone: string,
    quantity: number,
    status: TieredPostWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.bid = bid;
    this.createdAt = createdAt;
    this.cohort = cohort;
    this.summary = summary;
    this.timezone = timezone;
    this.quantity = quantity;
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

  canMoveTo(next: TieredPostWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPostWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered post window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.quantity - this.createdAt) * 100) / 100;
  }

  copy(): TieredPostWindow {
    return new TieredPostWindow(
      this.code,
      this.name,
      this.category,
      this.bid,
      this.createdAt,
      this.cohort,
      this.summary,
      this.timezone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered post window in status idle. */
export function newTieredPostWindow(code: string, name: string): TieredPostWindow {
  return new TieredPostWindow(code, name, "", 0, 0, "", "", "", 0, "idle");
}
