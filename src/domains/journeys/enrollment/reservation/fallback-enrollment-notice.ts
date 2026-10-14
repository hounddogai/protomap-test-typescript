import * as text from "../../../../kit/text.js";

/** Where a fallback enrollment notice is in its life cycle. */
export type FallbackEnrollmentNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback enrollment notice, with what the planners need to act on it. */
export class FallbackEnrollmentNotice {
  code: string;
  title: string;
  attributes: Map<string, string>;
  tags: string[];
  ownerId: string;
  quantity: number;
  status: FallbackEnrollmentNoticeStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    tags: string[],
    ownerId: string,
    quantity: number,
    status: FallbackEnrollmentNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.tags = tags;
    this.ownerId = ownerId;
    this.quantity = quantity;
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

  canMoveTo(next: FallbackEnrollmentNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackEnrollmentNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback enrollment notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback enrollment notice"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): FallbackEnrollmentNotice {
    return new FallbackEnrollmentNotice(
      this.code,
      this.title,
      this.attributes,
      this.tags,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback enrollment notice in status open. */
export function newFallbackEnrollmentNotice(code: string, title: string): FallbackEnrollmentNotice {
  return new FallbackEnrollmentNotice(code, title, new Map<string, string>(), [], "", 0, "open");
}
