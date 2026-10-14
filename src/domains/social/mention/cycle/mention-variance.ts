import * as text from "../../../../kit/text.js";

/** Where a mention variance is in its life cycle. */
export type MentionVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a mention variance and its current status. */
export class MentionVariance {
  code: string;
  label: string;
  rate: number;
  variant: string;
  channel: string;
  locale: string;
  externalRef: string;
  audienceId: string;
  category: string;
  status: MentionVarianceStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    variant: string,
    channel: string,
    locale: string,
    externalRef: string,
    audienceId: string,
    category: string,
    status: MentionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.variant = variant;
    this.channel = channel;
    this.locale = locale;
    this.externalRef = externalRef;
    this.audienceId = audienceId;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): MentionVariance {
    return new MentionVariance(
      this.code,
      this.label,
      this.rate,
      this.variant,
      this.channel,
      this.locale,
      this.externalRef,
      this.audienceId,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a mention variance in status new. */
export function newMentionVariance(code: string, label: string): MentionVariance {
  return new MentionVariance(code, label, 0, "", "", "", "", "", "", "new");
}
