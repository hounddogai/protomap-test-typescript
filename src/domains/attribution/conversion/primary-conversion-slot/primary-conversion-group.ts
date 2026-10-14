import * as text from "../../../../kit/text.js";

/** Where a primary conversion group is in its life cycle. */
export type PrimaryConversionGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One primary conversion group, with what the planners need to act on it. */
export class PrimaryConversionGroup {
  code: string;
  title: string;
  utmSource: string;
  visible: boolean;
  currency: string;
  limit: number;
  score: number;
  threshold: number;
  status: PrimaryConversionGroupStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    visible: boolean,
    currency: string,
    limit: number,
    score: number,
    threshold: number,
    status: PrimaryConversionGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.visible = visible;
    this.currency = currency;
    this.limit = limit;
    this.score = score;
    this.threshold = threshold;
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

  canMoveTo(next: PrimaryConversionGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: PrimaryConversionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round(this.threshold * this.limit * 100) / 100;
  }

  copy(): PrimaryConversionGroup {
    return new PrimaryConversionGroup(
      this.code,
      this.title,
      this.utmSource,
      this.visible,
      this.currency,
      this.limit,
      this.score,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary conversion group in status idle. */
export function newPrimaryConversionGroup(code: string, title: string): PrimaryConversionGroup {
  return new PrimaryConversionGroup(code, title, "", false, "", 0, 0, 0, "idle");
}
