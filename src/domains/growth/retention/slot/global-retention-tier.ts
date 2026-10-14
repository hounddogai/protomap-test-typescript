import * as text from "../../../../kit/text.js";

/** Where a global retention tier is in its life cycle. */
export type GlobalRetentionTierStatus = "requested" | "granted" | "revoked" | "expired";

/** A global retention tier. Its code is unique within a tenant. */
export class GlobalRetentionTier {
  code: string;
  title: string;
  attributes: Map<string, string>;
  region: string;
  batchSize: number;
  revision: number;
  visible: boolean;
  status: GlobalRetentionTierStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    region: string,
    batchSize: number,
    revision: number,
    visible: boolean,
    status: GlobalRetentionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.region = region;
    this.batchSize = batchSize;
    this.revision = revision;
    this.visible = visible;
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

  canMoveTo(next: GlobalRetentionTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalRetentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.batchSize + this.revision) * 100) / 100;
  }

  copy(): GlobalRetentionTier {
    return new GlobalRetentionTier(
      this.code,
      this.title,
      this.attributes,
      this.region,
      this.batchSize,
      this.revision,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global retention tier in status requested. */
export function newGlobalRetentionTier(code: string, title: string): GlobalRetentionTier {
  return new GlobalRetentionTier(code, title, new Map<string, string>(), "", 0, 0, false, "requested");
}
