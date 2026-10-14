import * as text from "../../../../kit/text.js";

/** Where a warmup audit is in its life cycle. */
export type WarmupAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A warmup audit as the warmup team keeps it. */
export class WarmupAudit {
  code: string;
  label: string;
  title: string;
  capacity: number;
  sendAt: number;
  country: string;
  graceDays: number;
  externalRef: string;
  attributes: Map<string, string>;
  status: WarmupAuditStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    capacity: number,
    sendAt: number,
    country: string,
    graceDays: number,
    externalRef: string,
    attributes: Map<string, string>,
    status: WarmupAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.country = country;
    this.graceDays = graceDays;
    this.externalRef = externalRef;
    this.attributes = attributes;
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

  canMoveTo(next: WarmupAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.capacity + this.graceDays) * 100) / 100;
  }

  copy(): WarmupAudit {
    return new WarmupAudit(
      this.code,
      this.label,
      this.title,
      this.capacity,
      this.sendAt,
      this.country,
      this.graceDays,
      this.externalRef,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a warmup audit in status draft. */
export function newWarmupAudit(code: string, label: string): WarmupAudit {
  return new WarmupAudit(code, label, "", 0, 0, "", 0, "", new Map<string, string>(), "draft");
}
