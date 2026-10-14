import * as text from "../../../../kit/text.js";

/** Where a macro milestone is in its life cycle. */
export type MacroMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro milestone. Its code is unique within a tenant. */
export class MacroMilestone {
  code: string;
  title: string;
  segment: string;
  journeyId: string;
  quantity: number;
  impressions: number;
  campaignRef: string;
  ratio: number;
  bid: number;
  description: string;
  status: MacroMilestoneStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    journeyId: string,
    quantity: number,
    impressions: number,
    campaignRef: string,
    ratio: number,
    bid: number,
    description: string,
    status: MacroMilestoneStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.bid = bid;
    this.description = description;
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

  canMoveTo(next: MacroMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.quantity + this.impressions) * 100) / 100;
  }

  copy(): MacroMilestone {
    return new MacroMilestone(
      this.code,
      this.title,
      this.segment,
      this.journeyId,
      this.quantity,
      this.impressions,
      this.campaignRef,
      this.ratio,
      this.bid,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a macro milestone in status requested. */
export function newMacroMilestone(code: string, title: string): MacroMilestone {
  return new MacroMilestone(code, title, "", "", 0, 0, "", 0, 0, "", "requested");
}
