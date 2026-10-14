import * as text from "../../../../kit/text.js";

/** Where a global subscription estimate is in its life cycle. */
export type GlobalSubscriptionEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** One global subscription estimate, with what the planners need to act on it. */
export class GlobalSubscriptionEstimate {
  code: string;
  name: string;
  expiresAt: number;
  campaignRef: string;
  source: string;
  conversionRate: number;
  status: GlobalSubscriptionEstimateStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    campaignRef: string,
    source: string,
    conversionRate: number,
    status: GlobalSubscriptionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.source = source;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: GlobalSubscriptionEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSubscriptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global subscription estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round((this.conversionRate + this.expiresAt) * 100) / 100;
  }

  copy(): GlobalSubscriptionEstimate {
    return new GlobalSubscriptionEstimate(
      this.code,
      this.name,
      this.expiresAt,
      this.campaignRef,
      this.source,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global subscription estimate in status requested. */
export function newGlobalSubscriptionEstimate(code: string, name: string): GlobalSubscriptionEstimate {
  return new GlobalSubscriptionEstimate(code, name, 0, "", "", 0, "requested");
}
