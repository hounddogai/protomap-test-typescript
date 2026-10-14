import * as text from "../../../../kit/text.js";

/** Where a primary warmup variance is in its life cycle. */
export type PrimaryWarmupVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary warmup variance. Its code is unique within a tenant. */
export class PrimaryWarmupVariance {
  code: string;
  name: string;
  tags: string[];
  locale: string;
  attempts: number;
  status: PrimaryWarmupVarianceStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    locale: string,
    attempts: number,
    status: PrimaryWarmupVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.locale = locale;
    this.attempts = attempts;
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

  canMoveTo(next: PrimaryWarmupVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
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

  moveTo(next: PrimaryWarmupVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary warmup variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): PrimaryWarmupVariance {
    return new PrimaryWarmupVariance(this.code, this.name, this.tags, this.locale, this.attempts, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary warmup variance in status idle. */
export function newPrimaryWarmupVariance(code: string, name: string): PrimaryWarmupVariance {
  return new PrimaryWarmupVariance(code, name, [], "", 0, "idle");
}
