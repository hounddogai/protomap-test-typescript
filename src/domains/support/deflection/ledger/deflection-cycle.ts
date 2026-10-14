import * as text from "../../../../kit/text.js";

/** Where a deflection cycle is in its life cycle. */
export type DeflectionCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One deflection cycle, with what the planners need to act on it. */
export class DeflectionCycle {
  code: string;
  label: string;
  channel: string;
  locale: string;
  clicks: number;
  attributes: Map<string, string>;
  archived: boolean;
  tags: string[];
  batchSize: number;
  retries: number;
  margin: number;
  status: DeflectionCycleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    locale: string,
    clicks: number,
    attributes: Map<string, string>,
    archived: boolean,
    tags: string[],
    batchSize: number,
    retries: number,
    margin: number,
    status: DeflectionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.locale = locale;
    this.clicks = clicks;
    this.attributes = attributes;
    this.archived = archived;
    this.tags = tags;
    this.batchSize = batchSize;
    this.retries = retries;
    this.margin = margin;
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

  canMoveTo(next: DeflectionCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
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

  adjustedVolume(): number {
    return Math.round((this.margin + this.clicks) * 100) / 100;
  }

  copy(): DeflectionCycle {
    return new DeflectionCycle(
      this.code,
      this.label,
      this.channel,
      this.locale,
      this.clicks,
      this.attributes,
      this.archived,
      this.tags,
      this.batchSize,
      this.retries,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection cycle in status idle. */
export function newDeflectionCycle(code: string, label: string): DeflectionCycle {
  return new DeflectionCycle(code, label, "", "", 0, new Map<string, string>(), false, [], 0, 0, 0, "idle");
}
