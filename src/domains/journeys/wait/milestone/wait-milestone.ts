/**
 * The wait milestone records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a wait milestone is in its life cycle. */
export type WaitMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** One wait milestone, with what the planners need to act on it. */
export class WaitMilestone {
  code: string;
  label: string;
  name: string;
  visible: boolean;
  locale: string;
  title: string;
  active: boolean;
  bid: number;
  conversionRate: number;
  audienceId: string;
  currency: string;
  status: WaitMilestoneStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    visible: boolean,
    locale: string,
    title: string,
    active: boolean,
    bid: number,
    conversionRate: number,
    audienceId: string,
    currency: string,
    status: WaitMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.visible = visible;
    this.locale = locale;
    this.title = title;
    this.active = active;
    this.bid = bid;
    this.conversionRate = conversionRate;
    this.audienceId = audienceId;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WaitMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round((this.conversionRate - this.bid) * 100) / 100;
  }

  copy(): WaitMilestone {
    return new WaitMilestone(
      this.code,
      this.label,
      this.name,
      this.visible,
      this.locale,
      this.title,
      this.active,
      this.bid,
      this.conversionRate,
      this.audienceId,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a wait milestone in status requested. */
export function newWaitMilestone(code: string, label: string): WaitMilestone {
  return new WaitMilestone(code, label, "", false, "", "", false, 0, 0, "", "", "requested");
}
