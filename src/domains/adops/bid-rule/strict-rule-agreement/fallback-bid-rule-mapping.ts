import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule mapping is in its life cycle. */
export type FallbackBidRuleMappingStatus = "created" | "validated" | "published" | "retired";

/** The record of a fallback bid rule mapping and its current status. */
export class FallbackBidRuleMapping {
  code: string;
  title: string;
  bid: number;
  notes: string;
  phone: string;
  status: FallbackBidRuleMappingStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    notes: string,
    phone: string,
    status: FallbackBidRuleMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.notes = notes;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBidRuleMappingStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBidRuleMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): FallbackBidRuleMapping {
    return new FallbackBidRuleMapping(this.code, this.title, this.bid, this.notes, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback bid rule mapping in status created. */
export function newFallbackBidRuleMapping(code: string, title: string): FallbackBidRuleMapping {
  return new FallbackBidRuleMapping(code, title, 0, "", "", "created");
}
