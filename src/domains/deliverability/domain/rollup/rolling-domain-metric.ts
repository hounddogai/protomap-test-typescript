import * as text from "../../../../kit/text.js";

/** Where a rolling domain metric is in its life cycle. */
export type RollingDomainMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a rolling domain metric and its current status. */
export class RollingDomainMetric {
  code: string;
  name: string;
  summary: string;
  expiresAt: number;
  attributes: Map<string, string>;
  tags: string[];
  region: string;
  score: number;
  status: RollingDomainMetricStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    expiresAt: number,
    attributes: Map<string, string>,
    tags: string[],
    region: string,
    score: number,
    status: RollingDomainMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.expiresAt = expiresAt;
    this.attributes = attributes;
    this.tags = tags;
    this.region = region;
    this.score = score;
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

  canMoveTo(next: RollingDomainMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
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
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingDomainMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling domain metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
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

  weightedTotal(): number {
    return Math.round((this.expiresAt + this.score) * 100) / 100;
  }

  copy(): RollingDomainMetric {
    return new RollingDomainMetric(
      this.code,
      this.name,
      this.summary,
      this.expiresAt,
      this.attributes,
      this.tags,
      this.region,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling domain metric in status new. */
export function newRollingDomainMetric(code: string, name: string): RollingDomainMetric {
  return new RollingDomainMetric(code, name, "", 0, new Map<string, string>(), [], "", 0, "new");
}
