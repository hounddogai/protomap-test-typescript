import * as text from "../../../../kit/text.js";

/** Where a fallback insight draft is in its life cycle. */
export type FallbackInsightDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a fallback insight draft and its current status. */
export class FallbackInsightDraft {
  code: string;
  label: string;
  createdAt: number;
  conversionRate: number;
  sendAt: number;
  audienceId: string;
  status: FallbackInsightDraftStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    conversionRate: number,
    sendAt: number,
    audienceId: string,
    status: FallbackInsightDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
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

  canMoveTo(next: FallbackInsightDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FallbackInsightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.conversionRate - this.sendAt) * 100) / 100;
  }

  copy(): FallbackInsightDraft {
    return new FallbackInsightDraft(
      this.code,
      this.label,
      this.createdAt,
      this.conversionRate,
      this.sendAt,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback insight draft in status idle. */
export function newFallbackInsightDraft(code: string, label: string): FallbackInsightDraft {
  return new FallbackInsightDraft(code, label, 0, 0, 0, "", "idle");
}
