import * as text from "../../../../kit/text.js";

/** Where a domain agreement is in its life cycle. */
export type DomainAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A domain agreement as the domain team keeps it. */
export class DomainAgreement {
  code: string;
  name: string;
  timezone: string;
  category: string;
  summary: string;
  limit: number;
  quantity: number;
  impressions: number;
  startsAt: number;
  cohort: string;
  score: number;
  status: DomainAgreementStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    category: string,
    summary: string,
    limit: number,
    quantity: number,
    impressions: number,
    startsAt: number,
    cohort: string,
    score: number,
    status: DomainAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.category = category;
    this.summary = summary;
    this.limit = limit;
    this.quantity = quantity;
    this.impressions = impressions;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DomainAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.startsAt + this.impressions) * 100) / 100;
  }

  copy(): DomainAgreement {
    return new DomainAgreement(
      this.code,
      this.name,
      this.timezone,
      this.category,
      this.summary,
      this.limit,
      this.quantity,
      this.impressions,
      this.startsAt,
      this.cohort,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a domain agreement in status new. */
export function newDomainAgreement(code: string, name: string): DomainAgreement {
  return new DomainAgreement(code, name, "", "", "", 0, 0, 0, 0, "", 0, "new");
}
