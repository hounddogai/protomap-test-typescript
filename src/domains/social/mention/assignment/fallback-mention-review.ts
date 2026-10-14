import * as text from "../../../../kit/text.js";

/** Where a fallback mention review is in its life cycle. */
export type FallbackMentionReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback mention review. Its code is unique within a tenant. */
export class FallbackMentionReview {
  code: string;
  name: string;
  segment: string;
  approved: boolean;
  amount: number;
  variant: string;
  utmSource: string;
  attributes: Map<string, string>;
  status: FallbackMentionReviewStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    approved: boolean,
    amount: number,
    variant: string,
    utmSource: string,
    attributes: Map<string, string>,
    status: FallbackMentionReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.approved = approved;
    this.amount = amount;
    this.variant = variant;
    this.utmSource = utmSource;
    this.attributes = attributes;
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

  canMoveTo(next: FallbackMentionReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: FallbackMentionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback mention review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
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

  copy(): FallbackMentionReview {
    return new FallbackMentionReview(
      this.code,
      this.name,
      this.segment,
      this.approved,
      this.amount,
      this.variant,
      this.utmSource,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback mention review in status requested. */
export function newFallbackMentionReview(code: string, name: string): FallbackMentionReview {
  return new FallbackMentionReview(code, name, "", false, 0, "", "", new Map<string, string>(), "requested");
}
