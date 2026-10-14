import * as text from "../../../../kit/text.js";

/** Where a complaint manifest is in its life cycle. */
export type ComplaintManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint manifest as the complaint team keeps it. */
export class ComplaintManifest {
  code: string;
  name: string;
  budget: number;
  attributes: Map<string, string>;
  version: number;
  margin: number;
  status: ComplaintManifestStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    attributes: Map<string, string>,
    version: number,
    margin: number,
    status: ComplaintManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.attributes = attributes;
    this.version = version;
    this.margin = margin;
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

  canMoveTo(next: ComplaintManifestStatus): boolean {
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
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ComplaintManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"complaint manifest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.version - this.margin) * 100) / 100;
  }

  copy(): ComplaintManifest {
    return new ComplaintManifest(
      this.code,
      this.name,
      this.budget,
      this.attributes,
      this.version,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a complaint manifest in status proposed. */
export function newComplaintManifest(code: string, name: string): ComplaintManifest {
  return new ComplaintManifest(code, name, 0, new Map<string, string>(), 0, 0, "proposed");
}
