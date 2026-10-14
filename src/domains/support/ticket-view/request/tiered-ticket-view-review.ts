import * as text from "../../../../kit/text.js";

/** Where a tiered ticket view review is in its life cycle. */
export type TieredTicketViewReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered ticket view review as the ticket view team keeps it. */
export class TieredTicketViewReview {
  code: string;
  label: string;
  ownerId: string;
  minimum: number;
  currency: string;
  region: string;
  revision: number;
  country: string;
  attributes: Map<string, string>;
  status: TieredTicketViewReviewStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    minimum: number,
    currency: string,
    region: string,
    revision: number,
    country: string,
    attributes: Map<string, string>,
    status: TieredTicketViewReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.currency = currency;
    this.region = region;
    this.revision = revision;
    this.country = country;
    this.attributes = attributes;
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

  canMoveTo(next: TieredTicketViewReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTicketViewReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered ticket view review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedValue(): number {
    return Math.round(this.minimum * this.revision * 100) / 100;
  }

  copy(): TieredTicketViewReview {
    return new TieredTicketViewReview(
      this.code,
      this.label,
      this.ownerId,
      this.minimum,
      this.currency,
      this.region,
      this.revision,
      this.country,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered ticket view review in status proposed. */
export function newTieredTicketViewReview(code: string, label: string): TieredTicketViewReview {
  return new TieredTicketViewReview(code, label, "", 0, "", "", 0, "", new Map<string, string>(), "proposed");
}
