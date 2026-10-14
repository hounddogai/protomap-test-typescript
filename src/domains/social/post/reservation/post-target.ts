import * as text from "../../../../kit/text.js";

/** Where a post target is in its life cycle. */
export type PostTargetStatus = "created" | "validated" | "published" | "retired";

/** The record of a post target and its current status. */
export class PostTarget {
  code: string;
  title: string;
  visible: boolean;
  conversionRate: number;
  source: string;
  clicks: number;
  status: PostTargetStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    conversionRate: number,
    source: string,
    clicks: number,
    status: PostTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.conversionRate = conversionRate;
    this.source = source;
    this.clicks = clicks;
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

  canMoveTo(next: PostTargetStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedTotal(): number {
    return Math.round((this.clicks - this.conversionRate) * 100) / 100;
  }

  copy(): PostTarget {
    return new PostTarget(
      this.code,
      this.title,
      this.visible,
      this.conversionRate,
      this.source,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a post target in status created. */
export function newPostTarget(code: string, title: string): PostTarget {
  return new PostTarget(code, title, false, 0, "", 0, "created");
}
