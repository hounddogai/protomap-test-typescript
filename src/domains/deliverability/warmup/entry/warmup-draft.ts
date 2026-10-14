import * as text from "../../../../kit/text.js";

/** Where a warmup draft is in its life cycle. */
export type WarmupDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a warmup draft and its current status. */
export class WarmupDraft {
  code: string;
  name: string;
  maximum: number;
  audienceId: string;
  sequence: number;
  priority: number;
  active: boolean;
  channel: string;
  campaignRef: string;
  status: WarmupDraftStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    audienceId: string,
    sequence: number,
    priority: number,
    active: boolean,
    channel: string,
    campaignRef: string,
    status: WarmupDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.audienceId = audienceId;
    this.sequence = sequence;
    this.priority = priority;
    this.active = active;
    this.channel = channel;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: WarmupDraftStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"warmup draft"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.maximum * this.priority * 100) / 100;
  }

  copy(): WarmupDraft {
    return new WarmupDraft(
      this.code,
      this.name,
      this.maximum,
      this.audienceId,
      this.sequence,
      this.priority,
      this.active,
      this.channel,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a warmup draft in status new. */
export function newWarmupDraft(code: string, name: string): WarmupDraft {
  return new WarmupDraft(code, name, 0, "", 0, 0, false, "", "", "new");
}
