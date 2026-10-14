import * as text from "../../../../kit/text.js";

/** Where a primary double opt in threshold is in its life cycle. */
export type PrimaryDoubleOptInThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary double opt in threshold. Its code is unique within a tenant. */
export class PrimaryDoubleOptInThreshold {
  code: string;
  title: string;
  visible: boolean;
  channel: string;
  source: string;
  frequencyCap: number;
  approved: boolean;
  contactEmail: string;
  version: number;
  status: PrimaryDoubleOptInThresholdStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    channel: string,
    source: string,
    frequencyCap: number,
    approved: boolean,
    contactEmail: string,
    version: number,
    status: PrimaryDoubleOptInThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.channel = channel;
    this.source = source;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.version = version;
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

  canMoveTo(next: PrimaryDoubleOptInThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
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

  moveTo(next: PrimaryDoubleOptInThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary double opt in threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.version + this.frequencyCap) * 100) / 100;
  }

  copy(): PrimaryDoubleOptInThreshold {
    return new PrimaryDoubleOptInThreshold(
      this.code,
      this.title,
      this.visible,
      this.channel,
      this.source,
      this.frequencyCap,
      this.approved,
      this.contactEmail,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary double opt in threshold in status draft. */
export function newPrimaryDoubleOptInThreshold(code: string, title: string): PrimaryDoubleOptInThreshold {
  return new PrimaryDoubleOptInThreshold(code, title, false, "", "", 0, false, "", 0, "draft");
}
