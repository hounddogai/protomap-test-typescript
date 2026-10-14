/**
 * The pending window manifest records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending window manifest is in its life cycle. */
export type PendingWindowManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pending window manifest as the window team keeps it. */
export class PendingWindowManifest {
  code: string;
  title: string;
  threshold: number;
  batchSize: number;
  visible: boolean;
  journeyId: string;
  version: number;
  ownerId: string;
  attributes: Map<string, string>;
  locale: string;
  currency: string;
  status: PendingWindowManifestStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    batchSize: number,
    visible: boolean,
    journeyId: string,
    version: number,
    ownerId: string,
    attributes: Map<string, string>,
    locale: string,
    currency: string,
    status: PendingWindowManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.batchSize = batchSize;
    this.visible = visible;
    this.journeyId = journeyId;
    this.version = version;
    this.ownerId = ownerId;
    this.attributes = attributes;
    this.locale = locale;
    this.currency = currency;
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

  canMoveTo(next: PendingWindowManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "failed":
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

  moveTo(next: PendingWindowManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending window manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"pending window manifest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.threshold - this.version) * 100) / 100;
  }

  copy(): PendingWindowManifest {
    return new PendingWindowManifest(
      this.code,
      this.title,
      this.threshold,
      this.batchSize,
      this.visible,
      this.journeyId,
      this.version,
      this.ownerId,
      this.attributes,
      this.locale,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending window manifest in status new. */
export function newPendingWindowManifest(code: string, title: string): PendingWindowManifest {
  return new PendingWindowManifest(code, title, 0, 0, false, "", 0, "", new Map<string, string>(), "", "", "new");
}
