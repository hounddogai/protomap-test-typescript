import * as text from "../../../../kit/text.js";

/** Where a strict tier exception is in its life cycle. */
export type StrictTierExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict tier exception. Its code is unique within a tenant. */
export class StrictTierException {
  code: string;
  label: string;
  floorValue: number;
  channel: string;
  budget: number;
  minimum: number;
  tags: string[];
  retries: number;
  durationMinutes: number;
  status: StrictTierExceptionStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    channel: string,
    budget: number,
    minimum: number,
    tags: string[],
    retries: number,
    durationMinutes: number,
    status: StrictTierExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.channel = channel;
    this.budget = budget;
    this.minimum = minimum;
    this.tags = tags;
    this.retries = retries;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: StrictTierExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictTierExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict tier exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.floorValue) * 100) / 100;
  }

  copy(): StrictTierException {
    return new StrictTierException(
      this.code,
      this.label,
      this.floorValue,
      this.channel,
      this.budget,
      this.minimum,
      this.tags,
      this.retries,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict tier exception in status idle. */
export function newStrictTierException(code: string, label: string): StrictTierException {
  return new StrictTierException(code, label, 0, "", 0, 0, [], 0, 0, "idle");
}
