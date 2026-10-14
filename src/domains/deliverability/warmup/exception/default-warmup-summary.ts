import * as text from "../../../../kit/text.js";

/** Where a default warmup summary is in its life cycle. */
export type DefaultWarmupSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a default warmup summary and its current status. */
export class DefaultWarmupSummary {
  code: string;
  label: string;
  locale: string;
  revision: number;
  endsAt: number;
  audienceId: string;
  contactEmail: string;
  status: DefaultWarmupSummaryStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    revision: number,
    endsAt: number,
    audienceId: string,
    contactEmail: string,
    status: DefaultWarmupSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.revision = revision;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: DefaultWarmupSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
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

  moveTo(next: DefaultWarmupSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.endsAt - this.revision) * 100) / 100;
  }

  copy(): DefaultWarmupSummary {
    return new DefaultWarmupSummary(
      this.code,
      this.label,
      this.locale,
      this.revision,
      this.endsAt,
      this.audienceId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default warmup summary in status new. */
export function newDefaultWarmupSummary(code: string, label: string): DefaultWarmupSummary {
  return new DefaultWarmupSummary(code, label, "", 0, 0, "", "", "new");
}
