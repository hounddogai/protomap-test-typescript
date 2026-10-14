import * as text from "../../../../kit/text.js";

/** Where a tiered suppression manifest is in its life cycle. */
export type TieredSuppressionManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered suppression manifest as the suppression team keeps it. */
export class TieredSuppressionManifest {
  code: string;
  title: string;
  name: string;
  description: string;
  ceiling: number;
  priority: number;
  expiresAt: number;
  discount: number;
  limit: number;
  status: TieredSuppressionManifestStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    description: string,
    ceiling: number,
    priority: number,
    expiresAt: number,
    discount: number,
    limit: number,
    status: TieredSuppressionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.description = description;
    this.ceiling = ceiling;
    this.priority = priority;
    this.expiresAt = expiresAt;
    this.discount = discount;
    this.limit = limit;
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

  canMoveTo(next: TieredSuppressionManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "failed";
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

  moveTo(next: TieredSuppressionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered suppression manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.discount + this.expiresAt) * 100) / 100;
  }

  copy(): TieredSuppressionManifest {
    return new TieredSuppressionManifest(
      this.code,
      this.title,
      this.name,
      this.description,
      this.ceiling,
      this.priority,
      this.expiresAt,
      this.discount,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered suppression manifest in status new. */
export function newTieredSuppressionManifest(code: string, title: string): TieredSuppressionManifest {
  return new TieredSuppressionManifest(code, title, "", "", 0, 0, 0, 0, 0, "new");
}
