import * as text from "../../../../kit/text.js";

/** Where a funnel baseline is in its life cycle. */
export type FunnelBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One funnel baseline, with what the planners need to act on it. */
export class FunnelBaseline {
  code: string;
  title: string;
  locale: string;
  channel: string;
  sequence: number;
  audienceId: string;
  createdAt: number;
  status: FunnelBaselineStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    channel: string,
    sequence: number,
    audienceId: string,
    createdAt: number,
    status: FunnelBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.channel = channel;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
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

  canMoveTo(next: FunnelBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FunnelBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.sequence + this.createdAt) * 100) / 100;
  }

  copy(): FunnelBaseline {
    return new FunnelBaseline(
      this.code,
      this.title,
      this.locale,
      this.channel,
      this.sequence,
      this.audienceId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a funnel baseline in status new. */
export function newFunnelBaseline(code: string, title: string): FunnelBaseline {
  return new FunnelBaseline(code, title, "", "", 0, "", 0, "new");
}
