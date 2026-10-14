import * as text from "../../../../kit/text.js";

/** Where a payout quota is in its life cycle. */
export type PayoutQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A payout quota as the payout team keeps it. */
export class PayoutQuota {
  code: string;
  title: string;
  attempts: number;
  floorValue: number;
  journeyId: string;
  weight: number;
  audienceId: string;
  region: string;
  openRate: number;
  status: PayoutQuotaStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    floorValue: number,
    journeyId: string,
    weight: number,
    audienceId: string,
    region: string,
    openRate: number,
    status: PayoutQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.floorValue = floorValue;
    this.journeyId = journeyId;
    this.weight = weight;
    this.audienceId = audienceId;
    this.region = region;
    this.openRate = openRate;
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

  canMoveTo(next: PayoutQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round(this.openRate * this.floorValue * 100) / 100;
  }

  copy(): PayoutQuota {
    return new PayoutQuota(
      this.code,
      this.title,
      this.attempts,
      this.floorValue,
      this.journeyId,
      this.weight,
      this.audienceId,
      this.region,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a payout quota in status proposed. */
export function newPayoutQuota(code: string, title: string): PayoutQuota {
  return new PayoutQuota(code, title, 0, 0, "", 0, "", "", 0, "proposed");
}
