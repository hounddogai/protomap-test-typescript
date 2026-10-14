import * as text from "../../../../kit/text.js";

/** Where a post threshold is in its life cycle. */
export type PostThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One post threshold, with what the planners need to act on it. */
export class PostThreshold {
  code: string;
  name: string;
  unit: string;
  sequence: number;
  margin: number;
  approved: boolean;
  summary: string;
  minimum: number;
  label: string;
  impressions: number;
  priority: number;
  status: PostThresholdStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    sequence: number,
    margin: number,
    approved: boolean,
    summary: string,
    minimum: number,
    label: string,
    impressions: number,
    priority: number,
    status: PostThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.sequence = sequence;
    this.margin = margin;
    this.approved = approved;
    this.summary = summary;
    this.minimum = minimum;
    this.label = label;
    this.impressions = impressions;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.sequence - this.impressions) * 100) / 100;
  }

  copy(): PostThreshold {
    return new PostThreshold(
      this.code,
      this.name,
      this.unit,
      this.sequence,
      this.margin,
      this.approved,
      this.summary,
      this.minimum,
      this.label,
      this.impressions,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a post threshold in status requested. */
export function newPostThreshold(code: string, name: string): PostThreshold {
  return new PostThreshold(code, name, "", 0, 0, false, "", 0, "", 0, 0, "requested");
}
