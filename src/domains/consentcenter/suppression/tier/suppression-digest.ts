import * as text from "../../../../kit/text.js";

/** Where a suppression digest is in its life cycle. */
export type SuppressionDigestStatus = "created" | "validated" | "published" | "retired";

/** One suppression digest, with what the planners need to act on it. */
export class SuppressionDigest {
  code: string;
  label: string;
  clicks: number;
  sequence: number;
  reviewer: string;
  frequencyCap: number;
  capacity: number;
  tags: string[];
  attempts: number;
  phone: string;
  graceDays: number;
  status: SuppressionDigestStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    sequence: number,
    reviewer: string,
    frequencyCap: number,
    capacity: number,
    tags: string[],
    attempts: number,
    phone: string,
    graceDays: number,
    status: SuppressionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.tags = tags;
    this.attempts = attempts;
    this.phone = phone;
    this.graceDays = graceDays;
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

  canMoveTo(next: SuppressionDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SuppressionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.graceDays - this.attempts) * 100) / 100;
  }

  copy(): SuppressionDigest {
    return new SuppressionDigest(
      this.code,
      this.label,
      this.clicks,
      this.sequence,
      this.reviewer,
      this.frequencyCap,
      this.capacity,
      this.tags,
      this.attempts,
      this.phone,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a suppression digest in status created. */
export function newSuppressionDigest(code: string, label: string): SuppressionDigest {
  return new SuppressionDigest(code, label, 0, 0, "", 0, 0, [], 0, "", 0, "created");
}
