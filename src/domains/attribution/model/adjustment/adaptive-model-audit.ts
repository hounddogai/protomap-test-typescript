import * as text from "../../../../kit/text.js";

/** Where a adaptive model audit is in its life cycle. */
export type AdaptiveModelAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One adaptive model audit, with what the planners need to act on it. */
export class AdaptiveModelAudit {
  code: string;
  name: string;
  region: string;
  threshold: number;
  capacity: number;
  graceDays: number;
  tags: string[];
  revision: number;
  attempts: number;
  clicks: number;
  label: string;
  status: AdaptiveModelAuditStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    threshold: number,
    capacity: number,
    graceDays: number,
    tags: string[],
    revision: number,
    attempts: number,
    clicks: number,
    label: string,
    status: AdaptiveModelAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.threshold = threshold;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.tags = tags;
    this.revision = revision;
    this.attempts = attempts;
    this.clicks = clicks;
    this.label = label;
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

  canMoveTo(next: AdaptiveModelAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveModelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive model audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round((this.graceDays + this.attempts) * 100) / 100;
  }

  copy(): AdaptiveModelAudit {
    return new AdaptiveModelAudit(
      this.code,
      this.name,
      this.region,
      this.threshold,
      this.capacity,
      this.graceDays,
      this.tags,
      this.revision,
      this.attempts,
      this.clicks,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive model audit in status draft. */
export function newAdaptiveModelAudit(code: string, name: string): AdaptiveModelAudit {
  return new AdaptiveModelAudit(code, name, "", 0, 0, 0, [], 0, 0, 0, "", "draft");
}
