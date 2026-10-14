import * as text from "../../../../kit/text.js";

/** Where a retention digest is in its life cycle. */
export type RetentionDigestStatus = "created" | "validated" | "published" | "retired";

/** One retention digest, with what the planners need to act on it. */
export class RetentionDigest {
  code: string;
  name: string;
  timezone: string;
  windowDays: number;
  weight: number;
  status: RetentionDigestStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    windowDays: number,
    weight: number,
    status: RetentionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.weight = weight;
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

  canMoveTo(next: RetentionDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.weight + this.windowDays) * 100) / 100;
  }

  copy(): RetentionDigest {
    return new RetentionDigest(this.code, this.name, this.timezone, this.windowDays, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention digest in status created. */
export function newRetentionDigest(code: string, name: string): RetentionDigest {
  return new RetentionDigest(code, name, "", 0, 0, "created");
}
