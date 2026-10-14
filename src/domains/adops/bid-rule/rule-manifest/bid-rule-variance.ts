import * as text from "../../../../kit/text.js";

/** Where a bid rule variance is in its life cycle. */
export type BidRuleVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a bid rule variance and its current status. */
export class BidRuleVariance {
  code: string;
  title: string;
  tags: string[];
  amount: number;
  journeyId: string;
  segment: string;
  attributes: Map<string, string>;
  name: string;
  status: BidRuleVarianceStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    amount: number,
    journeyId: string,
    segment: string,
    attributes: Map<string, string>,
    name: string,
    status: BidRuleVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.amount = amount;
    this.journeyId = journeyId;
    this.segment = segment;
    this.attributes = attributes;
    this.name = name;
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

  canMoveTo(next: BidRuleVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BidRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): BidRuleVariance {
    return new BidRuleVariance(
      this.code,
      this.title,
      this.tags,
      this.amount,
      this.journeyId,
      this.segment,
      this.attributes,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a bid rule variance in status requested. */
export function newBidRuleVariance(code: string, title: string): BidRuleVariance {
  return new BidRuleVariance(code, title, [], 0, "", "", new Map<string, string>(), "", "requested");
}
