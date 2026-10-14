import * as text from "../../../../kit/text.js";

/** Where a seasonal domain group is in its life cycle. */
export type SeasonalDomainGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal domain group. Its code is unique within a tenant. */
export class SeasonalDomainGroup {
  code: string;
  title: string;
  margin: number;
  amount: number;
  currency: string;
  unit: string;
  source: string;
  campaignRef: string;
  status: SeasonalDomainGroupStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    amount: number,
    currency: string,
    unit: string,
    source: string,
    campaignRef: string,
    status: SeasonalDomainGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.amount = amount;
    this.currency = currency;
    this.unit = unit;
    this.source = source;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: SeasonalDomainGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalDomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round(this.margin * this.amount * 100) / 100;
  }

  copy(): SeasonalDomainGroup {
    return new SeasonalDomainGroup(
      this.code,
      this.title,
      this.margin,
      this.amount,
      this.currency,
      this.unit,
      this.source,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a seasonal domain group in status idle. */
export function newSeasonalDomainGroup(code: string, title: string): SeasonalDomainGroup {
  return new SeasonalDomainGroup(code, title, 0, 0, "", "", "", "", "idle");
}
