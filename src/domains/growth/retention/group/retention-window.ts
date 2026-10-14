import * as text from "../../../../kit/text.js";

/** Where a retention window is in its life cycle. */
export type RetentionWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** One retention window, with what the planners need to act on it. */
export class RetentionWindow {
  code: string;
  label: string;
  updatedAt: number;
  tags: string[];
  variant: string;
  currency: string;
  title: string;
  ratio: number;
  sendAt: number;
  status: RetentionWindowStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    tags: string[],
    variant: string,
    currency: string,
    title: string,
    ratio: number,
    sendAt: number,
    status: RetentionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.tags = tags;
    this.variant = variant;
    this.currency = currency;
    this.title = title;
    this.ratio = ratio;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionWindowStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt - this.sendAt) * 100) / 100;
  }

  copy(): RetentionWindow {
    return new RetentionWindow(
      this.code,
      this.label,
      this.updatedAt,
      this.tags,
      this.variant,
      this.currency,
      this.title,
      this.ratio,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a retention window in status new. */
export function newRetentionWindow(code: string, label: string): RetentionWindow {
  return new RetentionWindow(code, label, 0, [], "", "", "", 0, 0, "new");
}
