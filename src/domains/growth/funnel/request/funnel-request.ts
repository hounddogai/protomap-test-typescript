/**
 * The funnel request records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel request is in its life cycle. */
export type FunnelRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** One funnel request, with what the planners need to act on it. */
export class FunnelRequest {
  code: string;
  title: string;
  expiresAt: number;
  ownerId: string;
  variant: string;
  version: number;
  attempts: number;
  attributes: Map<string, string>;
  status: FunnelRequestStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    ownerId: string,
    variant: string,
    version: number,
    attempts: number,
    attributes: Map<string, string>,
    status: FunnelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.variant = variant;
    this.version = version;
    this.attempts = attempts;
    this.attributes = attributes;
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

  canMoveTo(next: FunnelRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
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

  moveTo(next: FunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
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

  netLoad(): number {
    return Math.round((this.expiresAt - this.version) * 100) / 100;
  }

  copy(): FunnelRequest {
    return new FunnelRequest(
      this.code,
      this.title,
      this.expiresAt,
      this.ownerId,
      this.variant,
      this.version,
      this.attempts,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel request in status requested. */
export function newFunnelRequest(code: string, title: string): FunnelRequest {
  return new FunnelRequest(code, title, 0, "", "", 0, 0, new Map<string, string>(), "requested");
}
