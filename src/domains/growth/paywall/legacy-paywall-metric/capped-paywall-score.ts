import * as text from "../../../../kit/text.js";

/** Where a capped paywall score is in its life cycle. */
export type CappedPaywallScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped paywall score, with what the planners need to act on it. */
export class CappedPaywallScore {
  code: string;
  label: string;
  reviewer: string;
  source: string;
  phone: string;
  category: string;
  active: boolean;
  conversionRate: number;
  status: CappedPaywallScoreStatus;

  constructor(
    code: string,
    label: string,
    reviewer: string,
    source: string,
    phone: string,
    category: string,
    active: boolean,
    conversionRate: number,
    status: CappedPaywallScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.reviewer = reviewer;
    this.source = source;
    this.phone = phone;
    this.category = category;
    this.active = active;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPaywallScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPaywallScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped paywall score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): CappedPaywallScore {
    return new CappedPaywallScore(
      this.code,
      this.label,
      this.reviewer,
      this.source,
      this.phone,
      this.category,
      this.active,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped paywall score in status draft. */
export function newCappedPaywallScore(code: string, label: string): CappedPaywallScore {
  return new CappedPaywallScore(code, label, "", "", "", "", false, 0, "draft");
}
