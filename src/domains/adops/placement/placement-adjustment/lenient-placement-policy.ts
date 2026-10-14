import * as text from "../../../../kit/text.js";

/** Where a lenient placement policy is in its life cycle. */
export type LenientPlacementPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient placement policy, with what the planners need to act on it. */
export class LenientPlacementPolicy {
  code: string;
  name: string;
  rate: number;
  source: string;
  externalRef: string;
  channel: string;
  bid: number;
  minimum: number;
  description: string;
  ceiling: number;
  region: string;
  status: LenientPlacementPolicyStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    source: string,
    externalRef: string,
    channel: string,
    bid: number,
    minimum: number,
    description: string,
    ceiling: number,
    region: string,
    status: LenientPlacementPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.source = source;
    this.externalRef = externalRef;
    this.channel = channel;
    this.bid = bid;
    this.minimum = minimum;
    this.description = description;
    this.ceiling = ceiling;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPlacementPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientPlacementPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient placement policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient placement policy"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.rate * this.ceiling * 100) / 100;
  }

  copy(): LenientPlacementPolicy {
    return new LenientPlacementPolicy(
      this.code,
      this.name,
      this.rate,
      this.source,
      this.externalRef,
      this.channel,
      this.bid,
      this.minimum,
      this.description,
      this.ceiling,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a lenient placement policy in status open. */
export function newLenientPlacementPolicy(code: string, name: string): LenientPlacementPolicy {
  return new LenientPlacementPolicy(code, name, 0, "", "", "", 0, 0, "", 0, "", "open");
}
