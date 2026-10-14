import * as text from "../../../../kit/text.js";

/** Where a post rollup is in its life cycle. */
export type PostRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A post rollup as the post team keeps it. */
export class PostRollup {
  code: string;
  name: string;
  locale: string;
  capacity: number;
  conversionRate: number;
  batchSize: number;
  phone: string;
  timezone: string;
  status: PostRollupStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    capacity: number,
    conversionRate: number,
    batchSize: number,
    phone: string,
    timezone: string,
    status: PostRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.capacity = capacity;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.phone = phone;
    this.timezone = timezone;
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

  canMoveTo(next: PostRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PostRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedVolume(): number {
    return Math.round(this.batchSize * this.capacity * 100) / 100;
  }

  copy(): PostRollup {
    return new PostRollup(
      this.code,
      this.name,
      this.locale,
      this.capacity,
      this.conversionRate,
      this.batchSize,
      this.phone,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a post rollup in status new. */
export function newPostRollup(code: string, name: string): PostRollup {
  return new PostRollup(code, name, "", 0, 0, 0, "", "", "new");
}
