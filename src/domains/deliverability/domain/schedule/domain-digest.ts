import * as text from "../../../../kit/text.js";

/** Where a domain digest is in its life cycle. */
export type DomainDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** One domain digest, with what the planners need to act on it. */
export class DomainDigest {
  code: string;
  name: string;
  rate: number;
  cost: number;
  floorValue: number;
  budget: number;
  approved: boolean;
  segment: string;
  weight: number;
  bid: number;
  externalRef: string;
  status: DomainDigestStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    cost: number,
    floorValue: number,
    budget: number,
    approved: boolean,
    segment: string,
    weight: number,
    bid: number,
    externalRef: string,
    status: DomainDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.cost = cost;
    this.floorValue = floorValue;
    this.budget = budget;
    this.approved = approved;
    this.segment = segment;
    this.weight = weight;
    this.bid = bid;
    this.externalRef = externalRef;
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

  canMoveTo(next: DomainDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.floorValue - this.cost) * 100) / 100;
  }

  copy(): DomainDigest {
    return new DomainDigest(
      this.code,
      this.name,
      this.rate,
      this.cost,
      this.floorValue,
      this.budget,
      this.approved,
      this.segment,
      this.weight,
      this.bid,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a domain digest in status requested. */
export function newDomainDigest(code: string, name: string): DomainDigest {
  return new DomainDigest(code, name, 0, 0, 0, 0, false, "", 0, 0, "", "requested");
}
