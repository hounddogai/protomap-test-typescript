import * as text from "../../../../kit/text.js";

/** Where a sender target is in its life cycle. */
export type SenderTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sender target. Its code is unique within a tenant. */
export class SenderTarget {
  code: string;
  label: string;
  audienceId: string;
  startsAt: number;
  graceDays: number;
  retries: number;
  clicks: number;
  endsAt: number;
  source: string;
  status: SenderTargetStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    startsAt: number,
    graceDays: number,
    retries: number,
    clicks: number,
    endsAt: number,
    source: string,
    status: SenderTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.graceDays = graceDays;
    this.retries = retries;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.source = source;
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

  canMoveTo(next: SenderTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.clicks - this.endsAt) * 100) / 100;
  }

  copy(): SenderTarget {
    return new SenderTarget(
      this.code,
      this.label,
      this.audienceId,
      this.startsAt,
      this.graceDays,
      this.retries,
      this.clicks,
      this.endsAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a sender target in status proposed. */
export function newSenderTarget(code: string, label: string): SenderTarget {
  return new SenderTarget(code, label, "", 0, 0, 0, 0, 0, "", "proposed");
}
