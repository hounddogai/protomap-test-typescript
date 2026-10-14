import * as text from "../../../../kit/text.js";

/** Where a weighted macro score is in its life cycle. */
export type WeightedMacroScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted macro score, with what the planners need to act on it. */
export class WeightedMacroScore {
  code: string;
  label: string;
  locale: string;
  openRate: number;
  maximum: number;
  quantity: number;
  sequence: number;
  campaignRef: string;
  bid: number;
  variant: string;
  minimum: number;
  status: WeightedMacroScoreStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    openRate: number,
    maximum: number,
    quantity: number,
    sequence: number,
    campaignRef: string,
    bid: number,
    variant: string,
    minimum: number,
    status: WeightedMacroScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.openRate = openRate;
    this.maximum = maximum;
    this.quantity = quantity;
    this.sequence = sequence;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.variant = variant;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedMacroScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedMacroScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted macro score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.openRate + this.minimum) * 100) / 100;
  }

  copy(): WeightedMacroScore {
    return new WeightedMacroScore(
      this.code,
      this.label,
      this.locale,
      this.openRate,
      this.maximum,
      this.quantity,
      this.sequence,
      this.campaignRef,
      this.bid,
      this.variant,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted macro score in status new. */
export function newWeightedMacroScore(code: string, label: string): WeightedMacroScore {
  return new WeightedMacroScore(code, label, "", 0, 0, 0, 0, "", 0, "", 0, "new");
}
