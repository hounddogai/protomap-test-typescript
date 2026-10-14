import * as text from "../../../../kit/text.js";

/** Where a lenient warmup window is in its life cycle. */
export type LenientWarmupWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient warmup window. Its code is unique within a tenant. */
export class LenientWarmupWindow {
  code: string;
  name: string;
  phone: string;
  minimum: number;
  utmSource: string;
  updatedAt: number;
  channel: string;
  impressions: number;
  status: LenientWarmupWindowStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    minimum: number,
    utmSource: string,
    updatedAt: number,
    channel: string,
    impressions: number,
    status: LenientWarmupWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.minimum = minimum;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.impressions = impressions;
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

  canMoveTo(next: LenientWarmupWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientWarmupWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient warmup window"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.minimum * this.impressions * 100) / 100;
  }

  copy(): LenientWarmupWindow {
    return new LenientWarmupWindow(
      this.code,
      this.name,
      this.phone,
      this.minimum,
      this.utmSource,
      this.updatedAt,
      this.channel,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient warmup window in status new. */
export function newLenientWarmupWindow(code: string, name: string): LenientWarmupWindow {
  return new LenientWarmupWindow(code, name, "", 0, "", 0, "", 0, "new");
}
