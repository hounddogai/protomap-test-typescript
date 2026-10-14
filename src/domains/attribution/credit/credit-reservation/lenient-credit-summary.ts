import * as text from "../../../../kit/text.js";

/** Where a lenient credit summary is in its life cycle. */
export type LenientCreditSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient credit summary as the credit team keeps it. */
export class LenientCreditSummary {
  code: string;
  name: string;
  revision: number;
  endsAt: number;
  region: string;
  status: LenientCreditSummaryStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    endsAt: number,
    region: string,
    status: LenientCreditSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.endsAt = endsAt;
    this.region = region;
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

  canMoveTo(next: LenientCreditSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientCreditSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient credit summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.endsAt + this.revision) * 100) / 100;
  }

  copy(): LenientCreditSummary {
    return new LenientCreditSummary(this.code, this.name, this.revision, this.endsAt, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a lenient credit summary in status open. */
export function newLenientCreditSummary(code: string, name: string): LenientCreditSummary {
  return new LenientCreditSummary(code, name, 0, 0, "", "open");
}
