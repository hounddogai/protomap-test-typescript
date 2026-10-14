import * as text from "../../../../kit/text.js";

/** Where a tiered deflection manifest is in its life cycle. */
export type TieredDeflectionManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered deflection manifest. Its code is unique within a tenant. */
export class TieredDeflectionManifest {
  code: string;
  title: string;
  threshold: number;
  utmSource: string;
  priority: number;
  status: TieredDeflectionManifestStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    utmSource: string,
    priority: number,
    status: TieredDeflectionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.priority = priority;
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

  canMoveTo(next: TieredDeflectionManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredDeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered deflection manifest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.threshold * this.priority * 100) / 100;
  }

  copy(): TieredDeflectionManifest {
    return new TieredDeflectionManifest(
      this.code,
      this.title,
      this.threshold,
      this.utmSource,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered deflection manifest in status draft. */
export function newTieredDeflectionManifest(code: string, title: string): TieredDeflectionManifest {
  return new TieredDeflectionManifest(code, title, 0, "", 0, "draft");
}
