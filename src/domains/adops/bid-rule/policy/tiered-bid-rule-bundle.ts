import * as text from "../../../../kit/text.js";

/** Where a tiered bid rule bundle is in its life cycle. */
export type TieredBidRuleBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered bid rule bundle, with what the planners need to act on it. */
export class TieredBidRuleBundle {
  code: string;
  name: string;
  floorValue: number;
  locale: string;
  startsAt: number;
  status: TieredBidRuleBundleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    locale: string,
    startsAt: number,
    status: TieredBidRuleBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.locale = locale;
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

  canMoveTo(next: TieredBidRuleBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredBidRuleBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bid rule bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered bid rule bundle"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.floorValue * this.startsAt * 100) / 100;
  }

  copy(): TieredBidRuleBundle {
    return new TieredBidRuleBundle(this.code, this.name, this.floorValue, this.locale, this.startsAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered bid rule bundle in status planned. */
export function newTieredBidRuleBundle(code: string, name: string): TieredBidRuleBundle {
  return new TieredBidRuleBundle(code, name, 0, "", 0, "planned");
}
