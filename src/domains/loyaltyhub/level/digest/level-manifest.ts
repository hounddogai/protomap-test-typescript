import * as text from "../../../../kit/text.js";

/** Where a level manifest is in its life cycle. */
export type LevelManifestStatus = "created" | "validated" | "published" | "retired";

/** One level manifest, with what the planners need to act on it. */
export class LevelManifest {
  code: string;
  label: string;
  createdAt: number;
  externalRef: string;
  region: string;
  windowDays: number;
  cost: number;
  amount: number;
  priority: number;
  retries: number;
  status: LevelManifestStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    externalRef: string,
    region: string,
    windowDays: number,
    cost: number,
    amount: number,
    priority: number,
    retries: number,
    status: LevelManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.region = region;
    this.windowDays = windowDays;
    this.cost = cost;
    this.amount = amount;
    this.priority = priority;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelManifestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): LevelManifest {
    return new LevelManifest(
      this.code,
      this.label,
      this.createdAt,
      this.externalRef,
      this.region,
      this.windowDays,
      this.cost,
      this.amount,
      this.priority,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a level manifest in status created. */
export function newLevelManifest(code: string, label: string): LevelManifest {
  return new LevelManifest(code, label, 0, "", "", 0, 0, 0, 0, 0, "created");
}
