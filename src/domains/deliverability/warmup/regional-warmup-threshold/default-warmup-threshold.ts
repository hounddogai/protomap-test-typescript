/**
 * The default warmup threshold records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default warmup threshold is in its life cycle. */
export type DefaultWarmupThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default warmup threshold. Its code is unique within a tenant. */
export class DefaultWarmupThreshold {
  code: string;
  name: string;
  archived: boolean;
  channel: string;
  margin: number;
  graceDays: number;
  segment: string;
  tags: string[];
  rate: number;
  ceiling: number;
  status: DefaultWarmupThresholdStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    channel: string,
    margin: number,
    graceDays: number,
    segment: string,
    tags: string[],
    rate: number,
    ceiling: number,
    status: DefaultWarmupThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.channel = channel;
    this.margin = margin;
    this.graceDays = graceDays;
    this.segment = segment;
    this.tags = tags;
    this.rate = rate;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultWarmupThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultWarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default warmup threshold"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.ceiling + this.graceDays) * 100) / 100;
  }

  copy(): DefaultWarmupThreshold {
    return new DefaultWarmupThreshold(
      this.code,
      this.name,
      this.archived,
      this.channel,
      this.margin,
      this.graceDays,
      this.segment,
      this.tags,
      this.rate,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default warmup threshold in status draft. */
export function newDefaultWarmupThreshold(code: string, name: string): DefaultWarmupThreshold {
  return new DefaultWarmupThreshold(code, name, false, "", 0, 0, "", [], 0, 0, "draft");
}
