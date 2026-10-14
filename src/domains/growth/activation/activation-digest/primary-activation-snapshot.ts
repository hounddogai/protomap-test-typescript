import * as text from "../../../../kit/text.js";

/** Where a primary activation snapshot is in its life cycle. */
export type PrimaryActivationSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary activation snapshot and its current status. */
export class PrimaryActivationSnapshot {
  code: string;
  label: string;
  version: number;
  campaignRef: string;
  openRate: number;
  attributes: Map<string, string>;
  locale: string;
  category: string;
  status: PrimaryActivationSnapshotStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    campaignRef: string,
    openRate: number,
    attributes: Map<string, string>,
    locale: string,
    category: string,
    status: PrimaryActivationSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.campaignRef = campaignRef;
    this.openRate = openRate;
    this.attributes = attributes;
    this.locale = locale;
    this.category = category;
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

  canMoveTo(next: PrimaryActivationSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryActivationSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary activation snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round(this.openRate * this.version * 100) / 100;
  }

  copy(): PrimaryActivationSnapshot {
    return new PrimaryActivationSnapshot(
      this.code,
      this.label,
      this.version,
      this.campaignRef,
      this.openRate,
      this.attributes,
      this.locale,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary activation snapshot in status new. */
export function newPrimaryActivationSnapshot(code: string, label: string): PrimaryActivationSnapshot {
  return new PrimaryActivationSnapshot(code, label, 0, "", 0, new Map<string, string>(), "", "", "new");
}
