import * as text from "../../../../kit/text.js";

/** Where a lenient ticket view metric is in its life cycle. */
export type LenientTicketViewMetricStatus = "created" | "validated" | "published" | "retired";

/** A lenient ticket view metric as the ticket view team keeps it. */
export class LenientTicketViewMetric {
  code: string;
  title: string;
  amount: number;
  region: string;
  cost: number;
  weight: number;
  minimum: number;
  campaignRef: string;
  clicks: number;
  contactEmail: string;
  reviewer: string;
  status: LenientTicketViewMetricStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    region: string,
    cost: number,
    weight: number,
    minimum: number,
    campaignRef: string,
    clicks: number,
    contactEmail: string,
    reviewer: string,
    status: LenientTicketViewMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.region = region;
    this.cost = cost;
    this.weight = weight;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.contactEmail = contactEmail;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientTicketViewMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientTicketViewMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient ticket view metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.cost - this.clicks) * 100) / 100;
  }

  copy(): LenientTicketViewMetric {
    return new LenientTicketViewMetric(
      this.code,
      this.title,
      this.amount,
      this.region,
      this.cost,
      this.weight,
      this.minimum,
      this.campaignRef,
      this.clicks,
      this.contactEmail,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient ticket view metric in status created. */
export function newLenientTicketViewMetric(code: string, title: string): LenientTicketViewMetric {
  return new LenientTicketViewMetric(code, title, 0, "", 0, 0, 0, "", 0, "", "", "created");
}
