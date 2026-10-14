import * as text from "../../../../kit/text.js";

/** Where a pending level override is in its life cycle. */
export type PendingLevelOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a pending level override and its current status. */
export class PendingLevelOverride {
  code: string;
  title: string;
  locale: string;
  frequencyCap: number;
  score: number;
  externalRef: string;
  tags: string[];
  status: PendingLevelOverrideStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    frequencyCap: number,
    score: number,
    externalRef: string,
    tags: string[],
    status: PendingLevelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.externalRef = externalRef;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingLevelOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingLevelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending level override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.score + this.frequencyCap) * 100) / 100;
  }

  copy(): PendingLevelOverride {
    return new PendingLevelOverride(
      this.code,
      this.title,
      this.locale,
      this.frequencyCap,
      this.score,
      this.externalRef,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending level override in status planned. */
export function newPendingLevelOverride(code: string, title: string): PendingLevelOverride {
  return new PendingLevelOverride(code, title, "", 0, 0, "", [], "planned");
}
