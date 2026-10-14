import * as text from "../../../../kit/text.js";

/** Where a challenge window is in its life cycle. */
export type ChallengeWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One challenge window, with what the planners need to act on it. */
export class ChallengeWindow {
  code: string;
  title: string;
  attempts: number;
  clicks: number;
  tags: string[];
  locale: string;
  reviewer: string;
  batchSize: number;
  active: boolean;
  status: ChallengeWindowStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    clicks: number,
    tags: string[],
    locale: string,
    reviewer: string,
    batchSize: number,
    active: boolean,
    status: ChallengeWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.clicks = clicks;
    this.tags = tags;
    this.locale = locale;
    this.reviewer = reviewer;
    this.batchSize = batchSize;
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

  canMoveTo(next: ChallengeWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ChallengeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge window ${this.code} cannot move from ${this.status} to ${next}`);
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

  netLoad(): number {
    return Math.round(this.clicks * this.batchSize * 100) / 100;
  }

  copy(): ChallengeWindow {
    return new ChallengeWindow(
      this.code,
      this.title,
      this.attempts,
      this.clicks,
      this.tags,
      this.locale,
      this.reviewer,
      this.batchSize,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a challenge window in status open. */
export function newChallengeWindow(code: string, title: string): ChallengeWindow {
  return new ChallengeWindow(code, title, 0, 0, [], "", "", 0, false, "open");
}
