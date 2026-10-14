import * as text from "../../../../kit/text.js";

/** Where a pending leaderboard summary is in its life cycle. */
export type PendingLeaderboardSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending leaderboard summary. Its code is unique within a tenant. */
export class PendingLeaderboardSummary {
  code: string;
  title: string;
  contactEmail: string;
  openRate: number;
  phone: string;
  currency: string;
  priority: number;
  locale: string;
  unit: string;
  label: string;
  status: PendingLeaderboardSummaryStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    openRate: number,
    phone: string,
    currency: string,
    priority: number,
    locale: string,
    unit: string,
    label: string,
    status: PendingLeaderboardSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.phone = phone;
    this.currency = currency;
    this.priority = priority;
    this.locale = locale;
    this.unit = unit;
    this.label = label;
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

  canMoveTo(next: PendingLeaderboardSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingLeaderboardSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending leaderboard summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.openRate * this.priority * 100) / 100;
  }

  copy(): PendingLeaderboardSummary {
    return new PendingLeaderboardSummary(
      this.code,
      this.title,
      this.contactEmail,
      this.openRate,
      this.phone,
      this.currency,
      this.priority,
      this.locale,
      this.unit,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending leaderboard summary in status proposed. */
export function newPendingLeaderboardSummary(code: string, title: string): PendingLeaderboardSummary {
  return new PendingLeaderboardSummary(code, title, "", 0, "", "", 0, "", "", "", "proposed");
}
