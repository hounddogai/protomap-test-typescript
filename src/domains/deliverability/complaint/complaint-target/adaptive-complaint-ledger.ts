import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint ledger is in its life cycle. */
export type AdaptiveComplaintLedgerStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive complaint ledger, with what the planners need to act on it. */
export class AdaptiveComplaintLedger {
  code: string;
  title: string;
  tags: string[];
  description: string;
  threshold: number;
  windowDays: number;
  status: AdaptiveComplaintLedgerStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    description: string,
    threshold: number,
    windowDays: number,
    status: AdaptiveComplaintLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.description = description;
    this.threshold = threshold;
    this.windowDays = windowDays;
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

  canMoveTo(next: AdaptiveComplaintLedgerStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round(this.windowDays * this.threshold * 100) / 100;
  }

  copy(): AdaptiveComplaintLedger {
    return new AdaptiveComplaintLedger(
      this.code,
      this.title,
      this.tags,
      this.description,
      this.threshold,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive complaint ledger in status proposed. */
export function newAdaptiveComplaintLedger(code: string, title: string): AdaptiveComplaintLedger {
  return new AdaptiveComplaintLedger(code, title, [], "", 0, 0, "proposed");
}
