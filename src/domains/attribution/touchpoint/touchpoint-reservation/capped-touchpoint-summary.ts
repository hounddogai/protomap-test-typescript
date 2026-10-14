import * as text from "../../../../kit/text.js";

/** Where a capped touchpoint summary is in its life cycle. */
export type CappedTouchpointSummaryStatus = "created" | "validated" | "published" | "retired";

/** One capped touchpoint summary, with what the planners need to act on it. */
export class CappedTouchpointSummary {
  code: string;
  title: string;
  currency: string;
  locale: string;
  campaignRef: string;
  score: number;
  status: CappedTouchpointSummaryStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    locale: string,
    campaignRef: string,
    score: number,
    status: CappedTouchpointSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.score = score;
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

  canMoveTo(next: CappedTouchpointSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedTouchpointSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped touchpoint summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): CappedTouchpointSummary {
    return new CappedTouchpointSummary(
      this.code,
      this.title,
      this.currency,
      this.locale,
      this.campaignRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped touchpoint summary in status created. */
export function newCappedTouchpointSummary(code: string, title: string): CappedTouchpointSummary {
  return new CappedTouchpointSummary(code, title, "", "", "", 0, "created");
}
