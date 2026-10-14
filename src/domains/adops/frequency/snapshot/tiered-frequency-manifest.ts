import * as text from "../../../../kit/text.js";

/** Where a tiered frequency manifest is in its life cycle. */
export type TieredFrequencyManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered frequency manifest and its current status. */
export class TieredFrequencyManifest {
  code: string;
  name: string;
  ceiling: number;
  maximum: number;
  startsAt: number;
  attempts: number;
  tags: string[];
  source: string;
  status: TieredFrequencyManifestStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    maximum: number,
    startsAt: number,
    attempts: number,
    tags: string[],
    source: string,
    status: TieredFrequencyManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.attempts = attempts;
    this.tags = tags;
    this.source = source;
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

  canMoveTo(next: TieredFrequencyManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: TieredFrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round(this.maximum * this.ceiling * 100) / 100;
  }

  copy(): TieredFrequencyManifest {
    return new TieredFrequencyManifest(
      this.code,
      this.name,
      this.ceiling,
      this.maximum,
      this.startsAt,
      this.attempts,
      this.tags,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered frequency manifest in status new. */
export function newTieredFrequencyManifest(code: string, name: string): TieredFrequencyManifest {
  return new TieredFrequencyManifest(code, name, 0, 0, 0, 0, [], "", "new");
}
