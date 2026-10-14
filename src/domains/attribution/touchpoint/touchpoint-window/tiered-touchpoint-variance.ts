import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint variance is in its life cycle. */
export type TieredTouchpointVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered touchpoint variance and its current status. */
export class TieredTouchpointVariance {
  code: string;
  label: string;
  amount: number;
  channel: string;
  limit: number;
  campaignRef: string;
  notes: string;
  timezone: string;
  status: TieredTouchpointVarianceStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    channel: string,
    limit: number,
    campaignRef: string,
    notes: string,
    timezone: string,
    status: TieredTouchpointVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.channel = channel;
    this.limit = limit;
    this.campaignRef = campaignRef;
    this.notes = notes;
    this.timezone = timezone;
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

  canMoveTo(next: TieredTouchpointVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: TieredTouchpointVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.limit + this.amount) * 100) / 100;
  }

  copy(): TieredTouchpointVariance {
    return new TieredTouchpointVariance(
      this.code,
      this.label,
      this.amount,
      this.channel,
      this.limit,
      this.campaignRef,
      this.notes,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered touchpoint variance in status proposed. */
export function newTieredTouchpointVariance(code: string, label: string): TieredTouchpointVariance {
  return new TieredTouchpointVariance(code, label, 0, "", 0, "", "", "", "proposed");
}
