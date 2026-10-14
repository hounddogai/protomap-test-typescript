import * as text from "../../../../kit/text.js";

/** Where a lenient conversion policy is in its life cycle. */
export type LenientConversionPolicyStatus = "new" | "queued" | "running" | "done" | "failed";

/** One lenient conversion policy, with what the planners need to act on it. */
export class LenientConversionPolicy {
  code: string;
  name: string;
  journeyId: string;
  currency: string;
  revision: number;
  openRate: number;
  segment: string;
  summary: string;
  discount: number;
  status: LenientConversionPolicyStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    currency: string,
    revision: number,
    openRate: number,
    segment: string,
    summary: string,
    discount: number,
    status: LenientConversionPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.currency = currency;
    this.revision = revision;
    this.openRate = openRate;
    this.segment = segment;
    this.summary = summary;
    this.discount = discount;
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

  canMoveTo(next: LenientConversionPolicyStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientConversionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round((this.openRate + this.revision) * 100) / 100;
  }

  copy(): LenientConversionPolicy {
    return new LenientConversionPolicy(
      this.code,
      this.name,
      this.journeyId,
      this.currency,
      this.revision,
      this.openRate,
      this.segment,
      this.summary,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient conversion policy in status new. */
export function newLenientConversionPolicy(code: string, name: string): LenientConversionPolicy {
  return new LenientConversionPolicy(code, name, "", "", 0, 0, "", "", 0, "new");
}
