import * as text from "../../../../kit/text.js";

/** Where a adaptive redemption summary is in its life cycle. */
export type AdaptiveRedemptionSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive redemption summary. Its code is unique within a tenant. */
export class AdaptiveRedemptionSummary {
  code: string;
  title: string;
  channel: string;
  durationMinutes: number;
  source: string;
  status: AdaptiveRedemptionSummaryStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    durationMinutes: number,
    source: string,
    status: AdaptiveRedemptionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.durationMinutes = durationMinutes;
    this.source = source;
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

  canMoveTo(next: AdaptiveRedemptionSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRedemptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive redemption summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): AdaptiveRedemptionSummary {
    return new AdaptiveRedemptionSummary(
      this.code,
      this.title,
      this.channel,
      this.durationMinutes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive redemption summary in status open. */
export function newAdaptiveRedemptionSummary(code: string, title: string): AdaptiveRedemptionSummary {
  return new AdaptiveRedemptionSummary(code, title, "", 0, "", "open");
}
