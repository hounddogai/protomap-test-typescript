import * as text from "../../../../kit/text.js";

/** Where a invite summary is in its life cycle. */
export type InviteSummaryStatus = "created" | "validated" | "published" | "retired";

/** A invite summary. Its code is unique within a tenant. */
export class InviteSummary {
  code: string;
  label: string;
  externalRef: string;
  threshold: number;
  summary: string;
  variant: string;
  segment: string;
  cohort: string;
  ratio: number;
  status: InviteSummaryStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    threshold: number,
    summary: string,
    variant: string,
    segment: string,
    cohort: string,
    ratio: number,
    status: InviteSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.summary = summary;
    this.variant = variant;
    this.segment = segment;
    this.cohort = cohort;
    this.ratio = ratio;
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

  canMoveTo(next: InviteSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.threshold + this.ratio) * 100) / 100;
  }

  copy(): InviteSummary {
    return new InviteSummary(
      this.code,
      this.label,
      this.externalRef,
      this.threshold,
      this.summary,
      this.variant,
      this.segment,
      this.cohort,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a invite summary in status created. */
export function newInviteSummary(code: string, label: string): InviteSummary {
  return new InviteSummary(code, label, "", 0, "", "", "", "", 0, "created");
}
