import * as text from "../../../../kit/text.js";

/** Where a global level threshold is in its life cycle. */
export type GlobalLevelThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global level threshold, with what the planners need to act on it. */
export class GlobalLevelThreshold {
  code: string;
  title: string;
  tags: string[];
  startsAt: number;
  description: string;
  locale: string;
  contactEmail: string;
  status: GlobalLevelThresholdStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    startsAt: number,
    description: string,
    locale: string,
    contactEmail: string,
    status: GlobalLevelThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.startsAt = startsAt;
    this.description = description;
    this.locale = locale;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: GlobalLevelThresholdStatus): boolean {
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
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalLevelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global level threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
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

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): GlobalLevelThreshold {
    return new GlobalLevelThreshold(
      this.code,
      this.title,
      this.tags,
      this.startsAt,
      this.description,
      this.locale,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global level threshold in status open. */
export function newGlobalLevelThreshold(code: string, title: string): GlobalLevelThreshold {
  return new GlobalLevelThreshold(code, title, [], 0, "", "", "", "open");
}
