/**
 * The scheduled activation manifest records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled activation manifest is in its life cycle. */
export type ScheduledActivationManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One scheduled activation manifest, with what the planners need to act on it. */
export class ScheduledActivationManifest {
  code: string;
  title: string;
  limit: number;
  campaignRef: string;
  segment: string;
  minimum: number;
  maximum: number;
  source: string;
  contactEmail: string;
  attempts: number;
  status: ScheduledActivationManifestStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    campaignRef: string,
    segment: string,
    minimum: number,
    maximum: number,
    source: string,
    contactEmail: string,
    attempts: number,
    status: ScheduledActivationManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.minimum = minimum;
    this.maximum = maximum;
    this.source = source;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
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

  canMoveTo(next: ScheduledActivationManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
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

  moveTo(next: ScheduledActivationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled activation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round(this.limit * this.attempts * 100) / 100;
  }

  copy(): ScheduledActivationManifest {
    return new ScheduledActivationManifest(
      this.code,
      this.title,
      this.limit,
      this.campaignRef,
      this.segment,
      this.minimum,
      this.maximum,
      this.source,
      this.contactEmail,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a scheduled activation manifest in status proposed. */
export function newScheduledActivationManifest(code: string, title: string): ScheduledActivationManifest {
  return new ScheduledActivationManifest(code, title, 0, "", "", 0, 0, "", "", 0, "proposed");
}
