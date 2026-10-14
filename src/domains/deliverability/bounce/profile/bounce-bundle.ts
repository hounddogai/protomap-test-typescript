import * as text from "../../../../kit/text.js";

/** Where a bounce bundle is in its life cycle. */
export type BounceBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bounce bundle. Its code is unique within a tenant. */
export class BounceBundle {
  code: string;
  label: string;
  description: string;
  timezone: string;
  batchSize: number;
  utmSource: string;
  ratio: number;
  windowDays: number;
  locale: string;
  status: BounceBundleStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    timezone: string,
    batchSize: number,
    utmSource: string,
    ratio: number,
    windowDays: number,
    locale: string,
    status: BounceBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.timezone = timezone;
    this.batchSize = batchSize;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.windowDays = windowDays;
    this.locale = locale;
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

  canMoveTo(next: BounceBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BounceBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.windowDays * this.ratio * 100) / 100;
  }

  copy(): BounceBundle {
    return new BounceBundle(
      this.code,
      this.label,
      this.description,
      this.timezone,
      this.batchSize,
      this.utmSource,
      this.ratio,
      this.windowDays,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a bounce bundle in status idle. */
export function newBounceBundle(code: string, label: string): BounceBundle {
  return new BounceBundle(code, label, "", "", 0, "", 0, 0, "", "idle");
}
