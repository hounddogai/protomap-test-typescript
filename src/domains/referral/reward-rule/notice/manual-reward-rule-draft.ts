import * as text from "../../../../kit/text.js";

/** Where a manual reward rule draft is in its life cycle. */
export type ManualRewardRuleDraftStatus = "created" | "validated" | "published" | "retired";

/** The record of a manual reward rule draft and its current status. */
export class ManualRewardRuleDraft {
  code: string;
  label: string;
  endsAt: number;
  channel: string;
  maximum: number;
  locale: string;
  amount: number;
  status: ManualRewardRuleDraftStatus;

  constructor(
    code: string,
    label: string,
    endsAt: number,
    channel: string,
    maximum: number,
    locale: string,
    amount: number,
    status: ManualRewardRuleDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.endsAt = endsAt;
    this.channel = channel;
    this.maximum = maximum;
    this.locale = locale;
    this.amount = amount;
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

  canMoveTo(next: ManualRewardRuleDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
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

  moveTo(next: ManualRewardRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reward rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt - this.maximum) * 100) / 100;
  }

  copy(): ManualRewardRuleDraft {
    return new ManualRewardRuleDraft(
      this.code,
      this.label,
      this.endsAt,
      this.channel,
      this.maximum,
      this.locale,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual reward rule draft in status created. */
export function newManualRewardRuleDraft(code: string, label: string): ManualRewardRuleDraft {
  return new ManualRewardRuleDraft(code, label, 0, "", 0, "", 0, "created");
}
