import * as text from "../../../../kit/text.js";

/** Where a adaptive insight forecast is in its life cycle. */
export type AdaptiveInsightForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive insight forecast as the insight team keeps it. */
export class AdaptiveInsightForecast {
  code: string;
  name: string;
  channel: string;
  ownerId: string;
  reviewer: string;
  quantity: number;
  discount: number;
  checksum: string;
  summary: string;
  archived: boolean;
  contactEmail: string;
  status: AdaptiveInsightForecastStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    ownerId: string,
    reviewer: string,
    quantity: number,
    discount: number,
    checksum: string,
    summary: string,
    archived: boolean,
    contactEmail: string,
    status: AdaptiveInsightForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.discount = discount;
    this.checksum = checksum;
    this.summary = summary;
    this.archived = archived;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveInsightForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveInsightForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive insight forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive insight forecast"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.discount * this.quantity * 100) / 100;
  }

  copy(): AdaptiveInsightForecast {
    return new AdaptiveInsightForecast(
      this.code,
      this.name,
      this.channel,
      this.ownerId,
      this.reviewer,
      this.quantity,
      this.discount,
      this.checksum,
      this.summary,
      this.archived,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive insight forecast in status proposed. */
export function newAdaptiveInsightForecast(code: string, name: string): AdaptiveInsightForecast {
  return new AdaptiveInsightForecast(code, name, "", "", "", 0, 0, "", "", false, "", "proposed");
}
