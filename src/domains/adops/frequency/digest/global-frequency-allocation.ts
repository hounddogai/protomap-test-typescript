import * as text from "../../../../kit/text.js";

/** Where a global frequency allocation is in its life cycle. */
export type GlobalFrequencyAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** One global frequency allocation, with what the planners need to act on it. */
export class GlobalFrequencyAllocation {
  code: string;
  title: string;
  limit: number;
  phone: string;
  summary: string;
  source: string;
  currency: string;
  endsAt: number;
  updatedAt: number;
  journeyId: string;
  status: GlobalFrequencyAllocationStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    phone: string,
    summary: string,
    source: string,
    currency: string,
    endsAt: number,
    updatedAt: number,
    journeyId: string,
    status: GlobalFrequencyAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.phone = phone;
    this.summary = summary;
    this.source = source;
    this.currency = currency;
    this.endsAt = endsAt;
    this.updatedAt = updatedAt;
    this.journeyId = journeyId;
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

  canMoveTo(next: GlobalFrequencyAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: GlobalFrequencyAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global frequency allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round(this.endsAt * this.limit * 100) / 100;
  }

  copy(): GlobalFrequencyAllocation {
    return new GlobalFrequencyAllocation(
      this.code,
      this.title,
      this.limit,
      this.phone,
      this.summary,
      this.source,
      this.currency,
      this.endsAt,
      this.updatedAt,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global frequency allocation in status requested. */
export function newGlobalFrequencyAllocation(code: string, title: string): GlobalFrequencyAllocation {
  return new GlobalFrequencyAllocation(code, title, 0, "", "", "", "", 0, 0, "", "requested");
}
