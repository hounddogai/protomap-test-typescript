import * as text from "../../../../kit/text.js";

/** Where a regional path bundle is in its life cycle. */
export type RegionalPathBundleStatus = "created" | "validated" | "published" | "retired";

/** The record of a regional path bundle and its current status. */
export class RegionalPathBundle {
  code: string;
  label: string;
  rate: number;
  channel: string;
  openRate: number;
  graceDays: number;
  tags: string[];
  contactEmail: string;
  status: RegionalPathBundleStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    channel: string,
    openRate: number,
    graceDays: number,
    tags: string[],
    contactEmail: string,
    status: RegionalPathBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.channel = channel;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.tags = tags;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPathBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalPathBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional path bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional path bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.graceDays - this.openRate) * 100) / 100;
  }

  copy(): RegionalPathBundle {
    return new RegionalPathBundle(
      this.code,
      this.label,
      this.rate,
      this.channel,
      this.openRate,
      this.graceDays,
      this.tags,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional path bundle in status created. */
export function newRegionalPathBundle(code: string, label: string): RegionalPathBundle {
  return new RegionalPathBundle(code, label, 0, "", 0, 0, [], "", "created");
}
