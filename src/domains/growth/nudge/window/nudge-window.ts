/**
 * The nudge window records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge window is in its life cycle. */
export type NudgeWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** One nudge window, with what the planners need to act on it. */
export class NudgeWindow {
  code: string;
  title: string;
  segment: string;
  amount: number;
  contactEmail: string;
  visible: boolean;
  clicks: number;
  campaignRef: string;
  status: NudgeWindowStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    amount: number,
    contactEmail: string,
    visible: boolean,
    clicks: number,
    campaignRef: string,
    status: NudgeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.amount = amount;
    this.contactEmail = contactEmail;
    this.visible = visible;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: NudgeWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: NudgeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.clicks - this.amount) * 100) / 100;
  }

  copy(): NudgeWindow {
    return new NudgeWindow(
      this.code,
      this.title,
      this.segment,
      this.amount,
      this.contactEmail,
      this.visible,
      this.clicks,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a nudge window in status requested. */
export function newNudgeWindow(code: string, title: string): NudgeWindow {
  return new NudgeWindow(code, title, "", 0, "", false, 0, "", "requested");
}
