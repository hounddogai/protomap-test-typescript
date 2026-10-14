import * as text from "../../../../kit/text.js";

/** Where a pending insight summary is in its life cycle. */
export type PendingInsightSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** One pending insight summary, with what the planners need to act on it. */
export class PendingInsightSummary {
  code: string;
  name: string;
  frequencyCap: number;
  title: string;
  locale: string;
  tags: string[];
  approved: boolean;
  journeyId: string;
  status: PendingInsightSummaryStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    title: string,
    locale: string,
    tags: string[],
    approved: boolean,
    journeyId: string,
    status: PendingInsightSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.locale = locale;
    this.tags = tags;
    this.approved = approved;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingInsightSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingInsightSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending insight summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending insight summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): PendingInsightSummary {
    return new PendingInsightSummary(
      this.code,
      this.name,
      this.frequencyCap,
      this.title,
      this.locale,
      this.tags,
      this.approved,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending insight summary in status requested. */
export function newPendingInsightSummary(code: string, name: string): PendingInsightSummary {
  return new PendingInsightSummary(code, name, 0, "", "", [], false, "", "requested");
}
