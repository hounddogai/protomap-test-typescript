import * as text from "../../../../kit/text.js";

/** Where a mention exception is in its life cycle. */
export type MentionExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A mention exception as the mention team keeps it. */
export class MentionException {
  code: string;
  title: string;
  tags: string[];
  budget: number;
  impressions: number;
  status: MentionExceptionStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    budget: number,
    impressions: number,
    status: MentionExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.budget = budget;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round((this.budget + this.impressions) * 100) / 100;
  }

  copy(): MentionException {
    return new MentionException(this.code, this.title, this.tags, this.budget, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention exception in status requested. */
export function newMentionException(code: string, title: string): MentionException {
  return new MentionException(code, title, [], 0, 0, "requested");
}
