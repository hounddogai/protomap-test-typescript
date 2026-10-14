import * as text from "../../../../kit/text.js";

/** Where a warmup quota is in its life cycle. */
export type WarmupQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One warmup quota, with what the planners need to act on it. */
export class WarmupQuota {
  code: string;
  label: string;
  retries: number;
  approved: boolean;
  campaignRef: string;
  summary: string;
  category: string;
  status: WarmupQuotaStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    approved: boolean,
    campaignRef: string,
    summary: string,
    category: string,
    status: WarmupQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.category = category;
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

  canMoveTo(next: WarmupQuotaStatus): boolean {
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

  moveTo(next: WarmupQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): WarmupQuota {
    return new WarmupQuota(
      this.code,
      this.label,
      this.retries,
      this.approved,
      this.campaignRef,
      this.summary,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a warmup quota in status open. */
export function newWarmupQuota(code: string, label: string): WarmupQuota {
  return new WarmupQuota(code, label, 0, false, "", "", "", "open");
}
