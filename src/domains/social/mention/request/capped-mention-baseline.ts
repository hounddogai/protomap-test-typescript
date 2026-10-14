import * as text from "../../../../kit/text.js";

/** Where a capped mention baseline is in its life cycle. */
export type CappedMentionBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A capped mention baseline. Its code is unique within a tenant. */
export class CappedMentionBaseline {
  code: string;
  title: string;
  expiresAt: number;
  openRate: number;
  channel: string;
  limit: number;
  utmSource: string;
  status: CappedMentionBaselineStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    openRate: number,
    channel: string,
    limit: number,
    utmSource: string,
    status: CappedMentionBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.openRate = openRate;
    this.channel = channel;
    this.limit = limit;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedMentionBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedMentionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round((this.limit - this.openRate) * 100) / 100;
  }

  copy(): CappedMentionBaseline {
    return new CappedMentionBaseline(
      this.code,
      this.title,
      this.expiresAt,
      this.openRate,
      this.channel,
      this.limit,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped mention baseline in status idle. */
export function newCappedMentionBaseline(code: string, title: string): CappedMentionBaseline {
  return new CappedMentionBaseline(code, title, 0, 0, "", 0, "", "idle");
}
