import * as text from "../../../../kit/text.js";

/** Where a strict sender digest is in its life cycle. */
export type StrictSenderDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict sender digest and its current status. */
export class StrictSenderDigest {
  code: string;
  title: string;
  category: string;
  threshold: number;
  frequencyCap: number;
  pinned: boolean;
  score: number;
  segment: string;
  status: StrictSenderDigestStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    threshold: number,
    frequencyCap: number,
    pinned: boolean,
    score: number,
    segment: string,
    status: StrictSenderDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.threshold = threshold;
    this.frequencyCap = frequencyCap;
    this.pinned = pinned;
    this.score = score;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictSenderDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictSenderDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict sender digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict sender digest"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.score - this.frequencyCap) * 100) / 100;
  }

  copy(): StrictSenderDigest {
    return new StrictSenderDigest(
      this.code,
      this.title,
      this.category,
      this.threshold,
      this.frequencyCap,
      this.pinned,
      this.score,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict sender digest in status draft. */
export function newStrictSenderDigest(code: string, title: string): StrictSenderDigest {
  return new StrictSenderDigest(code, title, "", 0, 0, false, 0, "", "draft");
}
