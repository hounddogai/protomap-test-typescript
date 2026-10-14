import * as text from "../../../../kit/text.js";

/** Where a adaptive badge exception is in its life cycle. */
export type AdaptiveBadgeExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive badge exception. Its code is unique within a tenant. */
export class AdaptiveBadgeException {
  code: string;
  label: string;
  floorValue: number;
  name: string;
  openRate: number;
  utmSource: string;
  summary: string;
  ownerId: string;
  status: AdaptiveBadgeExceptionStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    name: string,
    openRate: number,
    utmSource: string,
    summary: string,
    ownerId: string,
    status: AdaptiveBadgeExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.name = name;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.summary = summary;
    this.ownerId = ownerId;
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

  canMoveTo(next: AdaptiveBadgeExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBadgeExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive badge exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive badge exception"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.floorValue - this.openRate) * 100) / 100;
  }

  copy(): AdaptiveBadgeException {
    return new AdaptiveBadgeException(
      this.code,
      this.label,
      this.floorValue,
      this.name,
      this.openRate,
      this.utmSource,
      this.summary,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive badge exception in status idle. */
export function newAdaptiveBadgeException(code: string, label: string): AdaptiveBadgeException {
  return new AdaptiveBadgeException(code, label, 0, "", 0, "", "", "", "idle");
}
