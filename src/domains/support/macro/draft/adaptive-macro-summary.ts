import * as text from "../../../../kit/text.js";

/** Where a adaptive macro summary is in its life cycle. */
export type AdaptiveMacroSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One adaptive macro summary, with what the planners need to act on it. */
export class AdaptiveMacroSummary {
  code: string;
  label: string;
  cost: number;
  segment: string;
  variant: string;
  description: string;
  utmSource: string;
  status: AdaptiveMacroSummaryStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    segment: string,
    variant: string,
    description: string,
    utmSource: string,
    status: AdaptiveMacroSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.segment = segment;
    this.variant = variant;
    this.description = description;
    this.utmSource = utmSource;
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

  canMoveTo(next: AdaptiveMacroSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveMacroSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive macro summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive macro summary"} ${this.code}`;
  }

  measuredValue(): number {
    return this.cost;
  }

  copy(): AdaptiveMacroSummary {
    return new AdaptiveMacroSummary(
      this.code,
      this.label,
      this.cost,
      this.segment,
      this.variant,
      this.description,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive macro summary in status proposed. */
export function newAdaptiveMacroSummary(code: string, label: string): AdaptiveMacroSummary {
  return new AdaptiveMacroSummary(code, label, 0, "", "", "", "", "proposed");
}
