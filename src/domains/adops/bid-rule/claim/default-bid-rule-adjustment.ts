import * as text from "../../../../kit/text.js";

/** Where a default bid rule adjustment is in its life cycle. */
export type DefaultBidRuleAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default bid rule adjustment. Its code is unique within a tenant. */
export class DefaultBidRuleAdjustment {
  code: string;
  name: string;
  retries: number;
  summary: string;
  ceiling: number;
  threshold: number;
  ratio: number;
  updatedAt: number;
  frequencyCap: number;
  status: DefaultBidRuleAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    summary: string,
    ceiling: number,
    threshold: number,
    ratio: number,
    updatedAt: number,
    frequencyCap: number,
    status: DefaultBidRuleAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.summary = summary;
    this.ceiling = ceiling;
    this.threshold = threshold;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: DefaultBidRuleAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBidRuleAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default bid rule adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.ceiling + this.updatedAt) * 100) / 100;
  }

  copy(): DefaultBidRuleAdjustment {
    return new DefaultBidRuleAdjustment(
      this.code,
      this.name,
      this.retries,
      this.summary,
      this.ceiling,
      this.threshold,
      this.ratio,
      this.updatedAt,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default bid rule adjustment in status open. */
export function newDefaultBidRuleAdjustment(code: string, name: string): DefaultBidRuleAdjustment {
  return new DefaultBidRuleAdjustment(code, name, 0, "", 0, 0, 0, 0, 0, "open");
}
