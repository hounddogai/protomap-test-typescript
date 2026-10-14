import * as text from "../../../../kit/text.js";

/** Where a tiered mention tier is in its life cycle. */
export type TieredMentionTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered mention tier. Its code is unique within a tenant. */
export class TieredMentionTier {
  code: string;
  title: string;
  ratio: number;
  version: number;
  createdAt: number;
  attributes: Map<string, string>;
  contactEmail: string;
  status: TieredMentionTierStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    version: number,
    createdAt: number,
    attributes: Map<string, string>,
    contactEmail: string,
    status: TieredMentionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.version = version;
    this.createdAt = createdAt;
    this.attributes = attributes;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredMentionTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredMentionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered mention tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round(this.createdAt * this.ratio * 100) / 100;
  }

  copy(): TieredMentionTier {
    return new TieredMentionTier(
      this.code,
      this.title,
      this.ratio,
      this.version,
      this.createdAt,
      this.attributes,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered mention tier in status idle. */
export function newTieredMentionTier(code: string, title: string): TieredMentionTier {
  return new TieredMentionTier(code, title, 0, 0, 0, new Map<string, string>(), "", "idle");
}
