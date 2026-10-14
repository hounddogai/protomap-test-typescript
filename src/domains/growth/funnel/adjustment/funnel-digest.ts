import * as text from "../../../../kit/text.js";

/** Where a funnel digest is in its life cycle. */
export type FunnelDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One funnel digest, with what the planners need to act on it. */
export class FunnelDigest {
  code: string;
  title: string;
  approved: boolean;
  openRate: number;
  campaignRef: string;
  conversionRate: number;
  externalRef: string;
  status: FunnelDigestStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    openRate: number,
    campaignRef: string,
    conversionRate: number,
    externalRef: string,
    status: FunnelDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
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

  canMoveTo(next: FunnelDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedTotal(): number {
    return Math.round((this.conversionRate - this.openRate) * 100) / 100;
  }

  copy(): FunnelDigest {
    return new FunnelDigest(
      this.code,
      this.title,
      this.approved,
      this.openRate,
      this.campaignRef,
      this.conversionRate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel digest in status idle. */
export function newFunnelDigest(code: string, title: string): FunnelDigest {
  return new FunnelDigest(code, title, false, 0, "", 0, "", "idle");
}
