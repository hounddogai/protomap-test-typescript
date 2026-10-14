import * as text from "../../../../kit/text.js";

/** Where a rolling credit summary is in its life cycle. */
export type RollingCreditSummaryStatus = "created" | "validated" | "published" | "retired";

/** The record of a rolling credit summary and its current status. */
export class RollingCreditSummary {
  code: string;
  name: string;
  ratio: number;
  title: string;
  externalRef: string;
  bid: number;
  conversionRate: number;
  version: number;
  contactEmail: string;
  label: string;
  status: RollingCreditSummaryStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    title: string,
    externalRef: string,
    bid: number,
    conversionRate: number,
    version: number,
    contactEmail: string,
    label: string,
    status: RollingCreditSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.title = title;
    this.externalRef = externalRef;
    this.bid = bid;
    this.conversionRate = conversionRate;
    this.version = version;
    this.contactEmail = contactEmail;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingCreditSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RollingCreditSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling credit summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"rolling credit summary"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.conversionRate + this.bid) * 100) / 100;
  }

  copy(): RollingCreditSummary {
    return new RollingCreditSummary(
      this.code,
      this.name,
      this.ratio,
      this.title,
      this.externalRef,
      this.bid,
      this.conversionRate,
      this.version,
      this.contactEmail,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling credit summary in status created. */
export function newRollingCreditSummary(code: string, name: string): RollingCreditSummary {
  return new RollingCreditSummary(code, name, 0, "", "", 0, 0, 0, "", "", "created");
}
