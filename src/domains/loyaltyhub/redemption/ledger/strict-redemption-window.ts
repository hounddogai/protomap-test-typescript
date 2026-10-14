import * as text from "../../../../kit/text.js";

/** Where a strict redemption window is in its life cycle. */
export type StrictRedemptionWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict redemption window. Its code is unique within a tenant. */
export class StrictRedemptionWindow {
  code: string;
  title: string;
  campaignRef: string;
  summary: string;
  threshold: number;
  status: StrictRedemptionWindowStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    summary: string,
    threshold: number,
    status: StrictRedemptionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.threshold = threshold;
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

  canMoveTo(next: StrictRedemptionWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
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
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictRedemptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): StrictRedemptionWindow {
    return new StrictRedemptionWindow(
      this.code,
      this.title,
      this.campaignRef,
      this.summary,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict redemption window in status idle. */
export function newStrictRedemptionWindow(code: string, title: string): StrictRedemptionWindow {
  return new StrictRedemptionWindow(code, title, "", "", 0, "idle");
}
