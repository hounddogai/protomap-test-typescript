/**
 * The fallback warmup manifest records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback warmup manifest is in its life cycle. */
export type FallbackWarmupManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback warmup manifest, with what the planners need to act on it. */
export class FallbackWarmupManifest {
  code: string;
  title: string;
  openRate: number;
  sendAt: number;
  durationMinutes: number;
  unit: string;
  attempts: number;
  windowDays: number;
  graceDays: number;
  status: FallbackWarmupManifestStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    sendAt: number,
    durationMinutes: number,
    unit: string,
    attempts: number,
    windowDays: number,
    graceDays: number,
    status: FallbackWarmupManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.unit = unit;
    this.attempts = attempts;
    this.windowDays = windowDays;
    this.graceDays = graceDays;
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

  canMoveTo(next: FallbackWarmupManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackWarmupManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback warmup manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round(this.windowDays * this.durationMinutes * 100) / 100;
  }

  copy(): FallbackWarmupManifest {
    return new FallbackWarmupManifest(
      this.code,
      this.title,
      this.openRate,
      this.sendAt,
      this.durationMinutes,
      this.unit,
      this.attempts,
      this.windowDays,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fallback warmup manifest in status new. */
export function newFallbackWarmupManifest(code: string, title: string): FallbackWarmupManifest {
  return new FallbackWarmupManifest(code, title, 0, 0, 0, "", 0, 0, 0, "new");
}
