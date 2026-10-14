import * as text from "../../../../kit/text.js";

/** Where a default pacing summary is in its life cycle. */
export type DefaultPacingSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default pacing summary. Its code is unique within a tenant. */
export class DefaultPacingSummary {
  code: string;
  label: string;
  currency: string;
  rate: number;
  campaignRef: string;
  approved: boolean;
  status: DefaultPacingSummaryStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    rate: number,
    campaignRef: string,
    approved: boolean,
    status: DefaultPacingSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.approved = approved;
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

  canMoveTo(next: DefaultPacingSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultPacingSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default pacing summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): DefaultPacingSummary {
    return new DefaultPacingSummary(
      this.code,
      this.label,
      this.currency,
      this.rate,
      this.campaignRef,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default pacing summary in status open. */
export function newDefaultPacingSummary(code: string, label: string): DefaultPacingSummary {
  return new DefaultPacingSummary(code, label, "", 0, "", false, "open");
}
