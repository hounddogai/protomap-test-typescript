import * as text from "../../../../kit/text.js";

/** Where a opt out exception is in its life cycle. */
export type OptOutExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out exception. Its code is unique within a tenant. */
export class OptOutException {
  code: string;
  label: string;
  openRate: number;
  impressions: number;
  tags: string[];
  attempts: number;
  phone: string;
  endsAt: number;
  source: string;
  score: number;
  status: OptOutExceptionStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    impressions: number,
    tags: string[],
    attempts: number,
    phone: string,
    endsAt: number,
    source: string,
    score: number,
    status: OptOutExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.impressions = impressions;
    this.tags = tags;
    this.attempts = attempts;
    this.phone = phone;
    this.endsAt = endsAt;
    this.source = source;
    this.score = score;
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

  canMoveTo(next: OptOutExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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

  weightedTotal(): number {
    return Math.round((this.score - this.attempts) * 100) / 100;
  }

  copy(): OptOutException {
    return new OptOutException(
      this.code,
      this.label,
      this.openRate,
      this.impressions,
      this.tags,
      this.attempts,
      this.phone,
      this.endsAt,
      this.source,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a opt out exception in status draft. */
export function newOptOutException(code: string, label: string): OptOutException {
  return new OptOutException(code, label, 0, 0, [], 0, "", 0, "", 0, "draft");
}
