import * as text from "../../../../kit/text.js";

/** Where a warmup summary is in its life cycle. */
export type WarmupSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A warmup summary as the warmup team keeps it. */
export class WarmupSummary {
  code: string;
  title: string;
  label: string;
  priority: number;
  attempts: number;
  attributes: Map<string, string>;
  updatedAt: number;
  conversionRate: number;
  status: WarmupSummaryStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    priority: number,
    attempts: number,
    attributes: Map<string, string>,
    updatedAt: number,
    conversionRate: number,
    status: WarmupSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.priority = priority;
    this.attempts = attempts;
    this.attributes = attributes;
    this.updatedAt = updatedAt;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: WarmupSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.priority - this.updatedAt) * 100) / 100;
  }

  copy(): WarmupSummary {
    return new WarmupSummary(
      this.code,
      this.title,
      this.label,
      this.priority,
      this.attempts,
      this.attributes,
      this.updatedAt,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup summary in status new. */
export function newWarmupSummary(code: string, title: string): WarmupSummary {
  return new WarmupSummary(code, title, "", 0, 0, new Map<string, string>(), 0, 0, "new");
}
