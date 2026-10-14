import * as text from "../../../../kit/text.js";

/** Where a fallback window audit is in its life cycle. */
export type FallbackWindowAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One fallback window audit, with what the planners need to act on it. */
export class FallbackWindowAudit {
  code: string;
  name: string;
  ratio: number;
  createdAt: number;
  channel: string;
  reviewer: string;
  budget: number;
  discount: number;
  status: FallbackWindowAuditStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    createdAt: number,
    channel: string,
    reviewer: string,
    budget: number,
    discount: number,
    status: FallbackWindowAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.createdAt = createdAt;
    this.channel = channel;
    this.reviewer = reviewer;
    this.budget = budget;
    this.discount = discount;
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

  canMoveTo(next: FallbackWindowAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.ratio - this.budget) * 100) / 100;
  }

  copy(): FallbackWindowAudit {
    return new FallbackWindowAudit(
      this.code,
      this.name,
      this.ratio,
      this.createdAt,
      this.channel,
      this.reviewer,
      this.budget,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback window audit in status proposed. */
export function newFallbackWindowAudit(code: string, name: string): FallbackWindowAudit {
  return new FallbackWindowAudit(code, name, 0, 0, "", "", 0, 0, "proposed");
}
