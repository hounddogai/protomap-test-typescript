import * as text from "../../../../kit/text.js";

/** Where a adaptive redemption slot is in its life cycle. */
export type AdaptiveRedemptionSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive redemption slot, with what the planners need to act on it. */
export class AdaptiveRedemptionSlot {
  code: string;
  title: string;
  score: number;
  contactEmail: string;
  discount: number;
  summary: string;
  batchSize: number;
  version: number;
  status: AdaptiveRedemptionSlotStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    contactEmail: string,
    discount: number,
    summary: string,
    batchSize: number,
    version: number,
    status: AdaptiveRedemptionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.contactEmail = contactEmail;
    this.discount = discount;
    this.summary = summary;
    this.batchSize = batchSize;
    this.version = version;
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

  canMoveTo(next: AdaptiveRedemptionSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
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
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRedemptionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive redemption slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.discount * this.batchSize * 100) / 100;
  }

  copy(): AdaptiveRedemptionSlot {
    return new AdaptiveRedemptionSlot(
      this.code,
      this.title,
      this.score,
      this.contactEmail,
      this.discount,
      this.summary,
      this.batchSize,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive redemption slot in status open. */
export function newAdaptiveRedemptionSlot(code: string, title: string): AdaptiveRedemptionSlot {
  return new AdaptiveRedemptionSlot(code, title, 0, "", 0, "", 0, 0, "open");
}
