import * as text from "../../../../kit/text.js";

/** Where a post adjustment is in its life cycle. */
export type PostAdjustmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A post adjustment. Its code is unique within a tenant. */
export class PostAdjustment {
  code: string;
  title: string;
  utmSource: string;
  notes: string;
  pinned: boolean;
  attempts: number;
  label: string;
  status: PostAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    notes: string,
    pinned: boolean,
    attempts: number,
    label: string,
    status: PostAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.notes = notes;
    this.pinned = pinned;
    this.attempts = attempts;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostAdjustmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PostAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"post adjustment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.attempts;
  }

  copy(): PostAdjustment {
    return new PostAdjustment(
      this.code,
      this.title,
      this.utmSource,
      this.notes,
      this.pinned,
      this.attempts,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a post adjustment in status idle. */
export function newPostAdjustment(code: string, title: string): PostAdjustment {
  return new PostAdjustment(code, title, "", "", false, 0, "", "idle");
}
