/**
 * The batched placement rollup records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched placement rollup is in its life cycle. */
export type BatchedPlacementRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched placement rollup and its current status. */
export class BatchedPlacementRollup {
  code: string;
  name: string;
  attributes: Map<string, string>;
  retries: number;
  campaignRef: string;
  version: number;
  locale: string;
  phone: string;
  active: boolean;
  status: BatchedPlacementRollupStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    retries: number,
    campaignRef: string,
    version: number,
    locale: string,
    phone: string,
    active: boolean,
    status: BatchedPlacementRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.retries = retries;
    this.campaignRef = campaignRef;
    this.version = version;
    this.locale = locale;
    this.phone = phone;
    this.active = active;
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

  canMoveTo(next: BatchedPlacementRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
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

  moveTo(next: BatchedPlacementRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"batched placement rollup"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.version - this.retries) * 100) / 100;
  }

  copy(): BatchedPlacementRollup {
    return new BatchedPlacementRollup(
      this.code,
      this.name,
      this.attributes,
      this.retries,
      this.campaignRef,
      this.version,
      this.locale,
      this.phone,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched placement rollup in status requested. */
export function newBatchedPlacementRollup(code: string, name: string): BatchedPlacementRollup {
  return new BatchedPlacementRollup(code, name, new Map<string, string>(), 0, "", 0, "", "", false, "requested");
}
