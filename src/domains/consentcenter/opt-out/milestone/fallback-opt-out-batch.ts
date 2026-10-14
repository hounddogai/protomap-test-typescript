import * as text from "../../../../kit/text.js";

/** Where a fallback opt out batch is in its life cycle. */
export type FallbackOptOutBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback opt out batch. Its code is unique within a tenant. */
export class FallbackOptOutBatch {
  code: string;
  name: string;
  utmSource: string;
  weight: number;
  ratio: number;
  version: number;
  score: number;
  status: FallbackOptOutBatchStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    weight: number,
    ratio: number,
    version: number,
    score: number,
    status: FallbackOptOutBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.weight = weight;
    this.ratio = ratio;
    this.version = version;
    this.score = score;
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

  canMoveTo(next: FallbackOptOutBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: FallbackOptOutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback opt out batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.version - this.ratio) * 100) / 100;
  }

  copy(): FallbackOptOutBatch {
    return new FallbackOptOutBatch(
      this.code,
      this.name,
      this.utmSource,
      this.weight,
      this.ratio,
      this.version,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback opt out batch in status idle. */
export function newFallbackOptOutBatch(code: string, name: string): FallbackOptOutBatch {
  return new FallbackOptOutBatch(code, name, "", 0, 0, 0, 0, "idle");
}
