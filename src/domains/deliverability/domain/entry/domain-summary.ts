import * as text from "../../../../kit/text.js";

/** Where a domain summary is in its life cycle. */
export type DomainSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A domain summary as the domain team keeps it. */
export class DomainSummary {
  code: string;
  title: string;
  country: string;
  approved: boolean;
  campaignRef: string;
  visible: boolean;
  expiresAt: number;
  limit: number;
  status: DomainSummaryStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    approved: boolean,
    campaignRef: string,
    visible: boolean,
    expiresAt: number,
    limit: number,
    status: DomainSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.limit = limit;
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

  canMoveTo(next: DomainSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DomainSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.limit - this.expiresAt) * 100) / 100;
  }

  copy(): DomainSummary {
    return new DomainSummary(
      this.code,
      this.title,
      this.country,
      this.approved,
      this.campaignRef,
      this.visible,
      this.expiresAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a domain summary in status new. */
export function newDomainSummary(code: string, title: string): DomainSummary {
  return new DomainSummary(code, title, "", false, "", false, 0, 0, "new");
}
