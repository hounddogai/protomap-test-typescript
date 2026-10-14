import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint summary is in its life cycle. */
export type TieredTouchpointSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered touchpoint summary as the touchpoint team keeps it. */
export class TieredTouchpointSummary {
  code: string;
  name: string;
  ceiling: number;
  amount: number;
  locale: string;
  externalRef: string;
  channel: string;
  journeyId: string;
  region: string;
  summary: string;
  status: TieredTouchpointSummaryStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    amount: number,
    locale: string,
    externalRef: string,
    channel: string,
    journeyId: string,
    region: string,
    summary: string,
    status: TieredTouchpointSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.amount = amount;
    this.locale = locale;
    this.externalRef = externalRef;
    this.channel = channel;
    this.journeyId = journeyId;
    this.region = region;
    this.summary = summary;
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

  canMoveTo(next: TieredTouchpointSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredTouchpointSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.amount - this.ceiling) * 100) / 100;
  }

  copy(): TieredTouchpointSummary {
    return new TieredTouchpointSummary(
      this.code,
      this.name,
      this.ceiling,
      this.amount,
      this.locale,
      this.externalRef,
      this.channel,
      this.journeyId,
      this.region,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered touchpoint summary in status requested. */
export function newTieredTouchpointSummary(code: string, name: string): TieredTouchpointSummary {
  return new TieredTouchpointSummary(code, name, 0, 0, "", "", "", "", "", "", "requested");
}
