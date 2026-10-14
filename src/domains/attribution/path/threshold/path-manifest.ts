import * as text from "../../../../kit/text.js";

/** Where a path manifest is in its life cycle. */
export type PathManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One path manifest, with what the planners need to act on it. */
export class PathManifest {
  code: string;
  label: string;
  unit: string;
  category: string;
  discount: number;
  threshold: number;
  contactEmail: string;
  status: PathManifestStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    category: string,
    discount: number,
    threshold: number,
    contactEmail: string,
    status: PathManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.category = category;
    this.discount = discount;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: PathManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PathManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.threshold * this.discount * 100) / 100;
  }

  copy(): PathManifest {
    return new PathManifest(
      this.code,
      this.label,
      this.unit,
      this.category,
      this.discount,
      this.threshold,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a path manifest in status draft. */
export function newPathManifest(code: string, label: string): PathManifest {
  return new PathManifest(code, label, "", "", 0, 0, "", "draft");
}
