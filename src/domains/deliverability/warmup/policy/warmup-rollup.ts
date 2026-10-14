import * as text from "../../../../kit/text.js";

/** Where a warmup rollup is in its life cycle. */
export type WarmupRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One warmup rollup, with what the planners need to act on it. */
export class WarmupRollup {
  code: string;
  label: string;
  margin: number;
  attributes: Map<string, string>;
  cohort: string;
  active: boolean;
  name: string;
  endsAt: number;
  channel: string;
  threshold: number;
  expiresAt: number;
  status: WarmupRollupStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    attributes: Map<string, string>,
    cohort: string,
    active: boolean,
    name: string,
    endsAt: number,
    channel: string,
    threshold: number,
    expiresAt: number,
    status: WarmupRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.attributes = attributes;
    this.cohort = cohort;
    this.active = active;
    this.name = name;
    this.endsAt = endsAt;
    this.channel = channel;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WarmupRollupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: WarmupRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round((this.margin + this.endsAt) * 100) / 100;
  }

  copy(): WarmupRollup {
    return new WarmupRollup(
      this.code,
      this.label,
      this.margin,
      this.attributes,
      this.cohort,
      this.active,
      this.name,
      this.endsAt,
      this.channel,
      this.threshold,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a warmup rollup in status new. */
export function newWarmupRollup(code: string, label: string): WarmupRollup {
  return new WarmupRollup(code, label, 0, new Map<string, string>(), "", false, "", 0, "", 0, 0, "new");
}
