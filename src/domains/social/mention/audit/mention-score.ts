import * as text from "../../../../kit/text.js";

/** Where a mention score is in its life cycle. */
export type MentionScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A mention score as the mention team keeps it. */
export class MentionScore {
  code: string;
  label: string;
  ownerId: string;
  discount: number;
  ceiling: number;
  version: number;
  source: string;
  startsAt: number;
  active: boolean;
  status: MentionScoreStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    discount: number,
    ceiling: number,
    version: number,
    source: string,
    startsAt: number,
    active: boolean,
    status: MentionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.discount = discount;
    this.ceiling = ceiling;
    this.version = version;
    this.source = source;
    this.startsAt = startsAt;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: MentionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round((this.discount + this.ceiling) * 100) / 100;
  }

  copy(): MentionScore {
    return new MentionScore(
      this.code,
      this.label,
      this.ownerId,
      this.discount,
      this.ceiling,
      this.version,
      this.source,
      this.startsAt,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a mention score in status open. */
export function newMentionScore(code: string, label: string): MentionScore {
  return new MentionScore(code, label, "", 0, 0, 0, "", 0, false, "open");
}
