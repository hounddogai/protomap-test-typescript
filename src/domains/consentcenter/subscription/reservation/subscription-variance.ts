import * as text from "../../../../kit/text.js";

/** Where a subscription variance is in its life cycle. */
export type SubscriptionVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A subscription variance as the subscription team keeps it. */
export class SubscriptionVariance {
  code: string;
  label: string;
  source: string;
  archived: boolean;
  timezone: string;
  title: string;
  locale: string;
  tags: string[];
  minimum: number;
  journeyId: string;
  summary: string;
  status: SubscriptionVarianceStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    archived: boolean,
    timezone: string,
    title: string,
    locale: string,
    tags: string[],
    minimum: number,
    journeyId: string,
    summary: string,
    status: SubscriptionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.archived = archived;
    this.timezone = timezone;
    this.title = title;
    this.locale = locale;
    this.tags = tags;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SubscriptionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"subscription variance"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): SubscriptionVariance {
    return new SubscriptionVariance(
      this.code,
      this.label,
      this.source,
      this.archived,
      this.timezone,
      this.title,
      this.locale,
      this.tags,
      this.minimum,
      this.journeyId,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription variance in status draft. */
export function newSubscriptionVariance(code: string, label: string): SubscriptionVariance {
  return new SubscriptionVariance(code, label, "", false, "", "", "", [], 0, "", "", "draft");
}
