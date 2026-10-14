import * as text from "../../../../kit/text.js";

/** Where a default placement adjustment is in its life cycle. */
export type DefaultPlacementAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One default placement adjustment, with what the planners need to act on it. */
export class DefaultPlacementAdjustment {
  code: string;
  label: string;
  category: string;
  journeyId: string;
  bid: number;
  archived: boolean;
  budget: number;
  externalRef: string;
  amount: number;
  frequencyCap: number;
  openRate: number;
  status: DefaultPlacementAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    journeyId: string,
    bid: number,
    archived: boolean,
    budget: number,
    externalRef: string,
    amount: number,
    frequencyCap: number,
    openRate: number,
    status: DefaultPlacementAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.journeyId = journeyId;
    this.bid = bid;
    this.archived = archived;
    this.budget = budget;
    this.externalRef = externalRef;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
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

  canMoveTo(next: DefaultPlacementAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPlacementAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default placement adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate + this.frequencyCap) * 100) / 100;
  }

  copy(): DefaultPlacementAdjustment {
    return new DefaultPlacementAdjustment(
      this.code,
      this.label,
      this.category,
      this.journeyId,
      this.bid,
      this.archived,
      this.budget,
      this.externalRef,
      this.amount,
      this.frequencyCap,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default placement adjustment in status requested. */
export function newDefaultPlacementAdjustment(code: string, label: string): DefaultPlacementAdjustment {
  return new DefaultPlacementAdjustment(code, label, "", "", 0, false, 0, "", 0, 0, 0, "requested");
}
