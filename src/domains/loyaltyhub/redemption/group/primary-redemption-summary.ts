import * as text from "../../../../kit/text.js";

/** Where a primary redemption summary is in its life cycle. */
export type PrimaryRedemptionSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary redemption summary. Its code is unique within a tenant. */
export class PrimaryRedemptionSummary {
  code: string;
  label: string;
  score: number;
  archived: boolean;
  pinned: boolean;
  locale: string;
  channel: string;
  status: PrimaryRedemptionSummaryStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    archived: boolean,
    pinned: boolean,
    locale: string,
    channel: string,
    status: PrimaryRedemptionSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.archived = archived;
    this.pinned = pinned;
    this.locale = locale;
    this.channel = channel;
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

  canMoveTo(next: PrimaryRedemptionSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryRedemptionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary redemption summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimaryRedemptionSummary {
    return new PrimaryRedemptionSummary(
      this.code,
      this.label,
      this.score,
      this.archived,
      this.pinned,
      this.locale,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary redemption summary in status requested. */
export function newPrimaryRedemptionSummary(code: string, label: string): PrimaryRedemptionSummary {
  return new PrimaryRedemptionSummary(code, label, 0, false, false, "", "", "requested");
}
