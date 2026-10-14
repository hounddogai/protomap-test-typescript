/**
 * The manual path policy records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual path policy is in its life cycle. */
export type ManualPathPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual path policy as the path team keeps it. */
export class ManualPathPolicy {
  code: string;
  label: string;
  impressions: number;
  attributes: Map<string, string>;
  checksum: string;
  discount: number;
  audienceId: string;
  createdAt: number;
  locale: string;
  channel: string;
  name: string;
  status: ManualPathPolicyStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    attributes: Map<string, string>,
    checksum: string,
    discount: number,
    audienceId: string,
    createdAt: number,
    locale: string,
    channel: string,
    name: string,
    status: ManualPathPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.attributes = attributes;
    this.checksum = checksum;
    this.discount = discount;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.locale = locale;
    this.channel = channel;
    this.name = name;
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

  canMoveTo(next: ManualPathPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualPathPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual path policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
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

  effectiveVolume(): number {
    return Math.round(this.createdAt * this.impressions * 100) / 100;
  }

  copy(): ManualPathPolicy {
    return new ManualPathPolicy(
      this.code,
      this.label,
      this.impressions,
      this.attributes,
      this.checksum,
      this.discount,
      this.audienceId,
      this.createdAt,
      this.locale,
      this.channel,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual path policy in status requested. */
export function newManualPathPolicy(code: string, label: string): ManualPathPolicy {
  return new ManualPathPolicy(code, label, 0, new Map<string, string>(), "", 0, "", 0, "", "", "", "requested");
}
