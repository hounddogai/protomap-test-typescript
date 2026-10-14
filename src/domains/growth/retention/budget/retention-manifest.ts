import * as text from "../../../../kit/text.js";

/** Where a retention manifest is in its life cycle. */
export type RetentionManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention manifest. Its code is unique within a tenant. */
export class RetentionManifest {
  code: string;
  label: string;
  attributes: Map<string, string>;
  campaignRef: string;
  unit: string;
  discount: number;
  status: RetentionManifestStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    campaignRef: string,
    unit: string,
    discount: number,
    status: RetentionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
    this.unit = unit;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.discount;
  }

  copy(): RetentionManifest {
    return new RetentionManifest(
      this.code,
      this.label,
      this.attributes,
      this.campaignRef,
      this.unit,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a retention manifest in status open. */
export function newRetentionManifest(code: string, label: string): RetentionManifest {
  return new RetentionManifest(code, label, new Map<string, string>(), "", "", 0, "open");
}
