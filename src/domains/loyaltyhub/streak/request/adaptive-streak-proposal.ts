import * as text from "../../../../kit/text.js";

/** Where a adaptive streak proposal is in its life cycle. */
export type AdaptiveStreakProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive streak proposal and its current status. */
export class AdaptiveStreakProposal {
  code: string;
  title: string;
  timezone: string;
  unit: string;
  ceiling: number;
  openRate: number;
  externalRef: string;
  category: string;
  createdAt: number;
  status: AdaptiveStreakProposalStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    unit: string,
    ceiling: number,
    openRate: number,
    externalRef: string,
    category: string,
    createdAt: number,
    status: AdaptiveStreakProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.unit = unit;
    this.ceiling = ceiling;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.category = category;
    this.createdAt = createdAt;
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

  canMoveTo(next: AdaptiveStreakProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
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

  moveTo(next: AdaptiveStreakProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive streak proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.createdAt * this.openRate * 100) / 100;
  }

  copy(): AdaptiveStreakProposal {
    return new AdaptiveStreakProposal(
      this.code,
      this.title,
      this.timezone,
      this.unit,
      this.ceiling,
      this.openRate,
      this.externalRef,
      this.category,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive streak proposal in status requested. */
export function newAdaptiveStreakProposal(code: string, title: string): AdaptiveStreakProposal {
  return new AdaptiveStreakProposal(code, title, "", "", 0, 0, "", "", 0, "requested");
}
