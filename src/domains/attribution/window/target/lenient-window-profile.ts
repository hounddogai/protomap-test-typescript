import * as text from "../../../../kit/text.js";

/** Where a lenient window profile is in its life cycle. */
export type LenientWindowProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient window profile. Its code is unique within a tenant. */
export class LenientWindowProfile {
  code: string;
  label: string;
  ratio: number;
  priority: number;
  channel: string;
  utmSource: string;
  minimum: number;
  updatedAt: number;
  status: LenientWindowProfileStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    priority: number,
    channel: string,
    utmSource: string,
    minimum: number,
    updatedAt: number,
    status: LenientWindowProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.priority = priority;
    this.channel = channel;
    this.utmSource = utmSource;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: LenientWindowProfileStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientWindowProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient window profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.ratio + this.minimum) * 100) / 100;
  }

  copy(): LenientWindowProfile {
    return new LenientWindowProfile(
      this.code,
      this.label,
      this.ratio,
      this.priority,
      this.channel,
      this.utmSource,
      this.minimum,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient window profile in status new. */
export function newLenientWindowProfile(code: string, label: string): LenientWindowProfile {
  return new LenientWindowProfile(code, label, 0, 0, "", "", 0, 0, "new");
}
