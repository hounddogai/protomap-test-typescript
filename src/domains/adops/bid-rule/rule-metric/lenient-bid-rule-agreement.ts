import * as text from "../../../../kit/text.js";

/** Where a lenient bid rule agreement is in its life cycle. */
export type LenientBidRuleAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient bid rule agreement and its current status. */
export class LenientBidRuleAgreement {
  code: string;
  name: string;
  updatedAt: number;
  source: string;
  batchSize: number;
  endsAt: number;
  rate: number;
  version: number;
  windowDays: number;
  impressions: number;
  status: LenientBidRuleAgreementStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    source: string,
    batchSize: number,
    endsAt: number,
    rate: number,
    version: number,
    windowDays: number,
    impressions: number,
    status: LenientBidRuleAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.source = source;
    this.batchSize = batchSize;
    this.endsAt = endsAt;
    this.rate = rate;
    this.version = version;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientBidRuleAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientBidRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient bid rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"lenient bid rule agreement"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.windowDays + this.impressions) * 100) / 100;
  }

  copy(): LenientBidRuleAgreement {
    return new LenientBidRuleAgreement(
      this.code,
      this.name,
      this.updatedAt,
      this.source,
      this.batchSize,
      this.endsAt,
      this.rate,
      this.version,
      this.windowDays,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient bid rule agreement in status new. */
export function newLenientBidRuleAgreement(code: string, name: string): LenientBidRuleAgreement {
  return new LenientBidRuleAgreement(code, name, 0, "", 0, 0, 0, 0, 0, 0, "new");
}
