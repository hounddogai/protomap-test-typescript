import * as text from "../../../../kit/text.js";

/** Where a lenient warmup draft is in its life cycle. */
export type LenientWarmupDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient warmup draft as the warmup team keeps it. */
export class LenientWarmupDraft {
  code: string;
  label: string;
  contactEmail: string;
  utmSource: string;
  weight: number;
  bid: number;
  retries: number;
  region: string;
  status: LenientWarmupDraftStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    utmSource: string,
    weight: number,
    bid: number,
    retries: number,
    region: string,
    status: LenientWarmupDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.weight = weight;
    this.bid = bid;
    this.retries = retries;
    this.region = region;
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

  canMoveTo(next: LenientWarmupDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientWarmupDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.bid + this.retries) * 100) / 100;
  }

  copy(): LenientWarmupDraft {
    return new LenientWarmupDraft(
      this.code,
      this.label,
      this.contactEmail,
      this.utmSource,
      this.weight,
      this.bid,
      this.retries,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient warmup draft in status idle. */
export function newLenientWarmupDraft(code: string, label: string): LenientWarmupDraft {
  return new LenientWarmupDraft(code, label, "", "", 0, 0, 0, "", "idle");
}
