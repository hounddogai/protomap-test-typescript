import * as text from "../../../../kit/text.js";

/** Where a regional branch draft is in its life cycle. */
export type RegionalBranchDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional branch draft, with what the planners need to act on it. */
export class RegionalBranchDraft {
  code: string;
  label: string;
  locale: string;
  discount: number;
  country: string;
  createdAt: number;
  sequence: number;
  durationMinutes: number;
  budget: number;
  sendAt: number;
  floorValue: number;
  status: RegionalBranchDraftStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    discount: number,
    country: string,
    createdAt: number,
    sequence: number,
    durationMinutes: number,
    budget: number,
    sendAt: number,
    floorValue: number,
    status: RegionalBranchDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.discount = discount;
    this.country = country;
    this.createdAt = createdAt;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
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

  canMoveTo(next: RegionalBranchDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalBranchDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional branch draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round(this.durationMinutes * this.budget * 100) / 100;
  }

  copy(): RegionalBranchDraft {
    return new RegionalBranchDraft(
      this.code,
      this.label,
      this.locale,
      this.discount,
      this.country,
      this.createdAt,
      this.sequence,
      this.durationMinutes,
      this.budget,
      this.sendAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional branch draft in status idle. */
export function newRegionalBranchDraft(code: string, label: string): RegionalBranchDraft {
  return new RegionalBranchDraft(code, label, "", 0, "", 0, 0, 0, 0, 0, 0, "idle");
}
