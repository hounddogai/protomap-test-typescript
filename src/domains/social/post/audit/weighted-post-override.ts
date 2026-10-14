import * as text from "../../../../kit/text.js";

/** Where a weighted post override is in its life cycle. */
export type WeightedPostOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted post override. Its code is unique within a tenant. */
export class WeightedPostOverride {
  code: string;
  name: string;
  region: string;
  tags: string[];
  threshold: number;
  endsAt: number;
  status: WeightedPostOverrideStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    tags: string[],
    threshold: number,
    endsAt: number,
    status: WeightedPostOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.tags = tags;
    this.threshold = threshold;
    this.endsAt = endsAt;
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

  canMoveTo(next: WeightedPostOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: WeightedPostOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted post override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
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

  netExposure(): number {
    return Math.round(this.endsAt * this.threshold * 100) / 100;
  }

  copy(): WeightedPostOverride {
    return new WeightedPostOverride(
      this.code,
      this.name,
      this.region,
      this.tags,
      this.threshold,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted post override in status new. */
export function newWeightedPostOverride(code: string, name: string): WeightedPostOverride {
  return new WeightedPostOverride(code, name, "", [], 0, 0, "new");
}
