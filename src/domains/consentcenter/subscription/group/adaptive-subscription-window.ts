import * as text from "../../../../kit/text.js";

/** Where a adaptive subscription window is in its life cycle. */
export type AdaptiveSubscriptionWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive subscription window. Its code is unique within a tenant. */
export class AdaptiveSubscriptionWindow {
  code: string;
  title: string;
  active: boolean;
  frequencyCap: number;
  summary: string;
  startsAt: number;
  status: AdaptiveSubscriptionWindowStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    frequencyCap: number,
    summary: string,
    startsAt: number,
    status: AdaptiveSubscriptionWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.summary = summary;
    this.startsAt = startsAt;
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

  canMoveTo(next: AdaptiveSubscriptionWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: AdaptiveSubscriptionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive subscription window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive subscription window"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.startsAt - this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveSubscriptionWindow {
    return new AdaptiveSubscriptionWindow(
      this.code,
      this.title,
      this.active,
      this.frequencyCap,
      this.summary,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive subscription window in status planned. */
export function newAdaptiveSubscriptionWindow(code: string, title: string): AdaptiveSubscriptionWindow {
  return new AdaptiveSubscriptionWindow(code, title, false, 0, "", 0, "planned");
}
