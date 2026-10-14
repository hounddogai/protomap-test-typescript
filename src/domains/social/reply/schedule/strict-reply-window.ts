import * as text from "../../../../kit/text.js";

/** Where a strict reply window is in its life cycle. */
export type StrictReplyWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A strict reply window as the reply team keeps it. */
export class StrictReplyWindow {
  code: string;
  label: string;
  maximum: number;
  currency: string;
  contactEmail: string;
  cost: number;
  score: number;
  floorValue: number;
  locale: string;
  impressions: number;
  status: StrictReplyWindowStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    currency: string,
    contactEmail: string,
    cost: number,
    score: number,
    floorValue: number,
    locale: string,
    impressions: number,
    status: StrictReplyWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.score = score;
    this.floorValue = floorValue;
    this.locale = locale;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictReplyWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictReplyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reply window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict reply window"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.impressions * this.score * 100) / 100;
  }

  copy(): StrictReplyWindow {
    return new StrictReplyWindow(
      this.code,
      this.label,
      this.maximum,
      this.currency,
      this.contactEmail,
      this.cost,
      this.score,
      this.floorValue,
      this.locale,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a strict reply window in status draft. */
export function newStrictReplyWindow(code: string, label: string): StrictReplyWindow {
  return new StrictReplyWindow(code, label, 0, "", "", 0, 0, 0, "", 0, "draft");
}
