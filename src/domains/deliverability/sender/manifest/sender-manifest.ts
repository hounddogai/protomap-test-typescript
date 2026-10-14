/**
 * The sender manifest records of deliverability's sender work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sender manifest is in its life cycle. */
export type SenderManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sender manifest as the sender team keeps it. */
export class SenderManifest {
  code: string;
  title: string;
  priority: number;
  checksum: string;
  audienceId: string;
  updatedAt: number;
  minimum: number;
  status: SenderManifestStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    checksum: string,
    audienceId: string,
    updatedAt: number,
    minimum: number,
    status: SenderManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.minimum * this.updatedAt * 100) / 100;
  }

  copy(): SenderManifest {
    return new SenderManifest(
      this.code,
      this.title,
      this.priority,
      this.checksum,
      this.audienceId,
      this.updatedAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender manifest in status proposed. */
export function newSenderManifest(code: string, title: string): SenderManifest {
  return new SenderManifest(code, title, 0, "", "", 0, 0, "proposed");
}
