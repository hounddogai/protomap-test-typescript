import * as text from "../../../../kit/text.js";

/** Where a fallback reputation variance is in its life cycle. */
export type FallbackReputationVarianceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback reputation variance as the reputation team keeps it. */
export class FallbackReputationVariance {
  code: string;
  label: string;
  tags: string[];
  approved: boolean;
  checksum: string;
  quantity: number;
  status: FallbackReputationVarianceStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    approved: boolean,
    checksum: string,
    quantity: number,
    status: FallbackReputationVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.approved = approved;
    this.checksum = checksum;
    this.quantity = quantity;
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

  canMoveTo(next: FallbackReputationVarianceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackReputationVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reputation variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback reputation variance"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): FallbackReputationVariance {
    return new FallbackReputationVariance(
      this.code,
      this.label,
      this.tags,
      this.approved,
      this.checksum,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback reputation variance in status open. */
export function newFallbackReputationVariance(code: string, label: string): FallbackReputationVariance {
  return new FallbackReputationVariance(code, label, [], false, "", 0, "open");
}
