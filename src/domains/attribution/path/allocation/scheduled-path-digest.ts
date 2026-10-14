import * as text from "../../../../kit/text.js";

/** Where a scheduled path digest is in its life cycle. */
export type ScheduledPathDigestStatus = "created" | "validated" | "published" | "retired";

/** The record of a scheduled path digest and its current status. */
export class ScheduledPathDigest {
  code: string;
  title: string;
  active: boolean;
  cost: number;
  weight: number;
  floorValue: number;
  utmSource: string;
  status: ScheduledPathDigestStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    cost: number,
    weight: number,
    floorValue: number,
    utmSource: string,
    status: ScheduledPathDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.cost = cost;
    this.weight = weight;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledPathDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledPathDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled path digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"scheduled path digest"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.weight - this.floorValue) * 100) / 100;
  }

  copy(): ScheduledPathDigest {
    return new ScheduledPathDigest(
      this.code,
      this.title,
      this.active,
      this.cost,
      this.weight,
      this.floorValue,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a scheduled path digest in status created. */
export function newScheduledPathDigest(code: string, title: string): ScheduledPathDigest {
  return new ScheduledPathDigest(code, title, false, 0, 0, 0, "", "created");
}
