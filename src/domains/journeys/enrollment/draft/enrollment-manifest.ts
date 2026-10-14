import * as text from "../../../../kit/text.js";

/** Where a enrollment manifest is in its life cycle. */
export type EnrollmentManifestStatus = "created" | "validated" | "published" | "retired";

/** A enrollment manifest. Its code is unique within a tenant. */
export class EnrollmentManifest {
  code: string;
  name: string;
  approved: boolean;
  startsAt: number;
  updatedAt: number;
  attributes: Map<string, string>;
  retries: number;
  discount: number;
  status: EnrollmentManifestStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    startsAt: number,
    updatedAt: number,
    attributes: Map<string, string>,
    retries: number,
    discount: number,
    status: EnrollmentManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.retries = retries;
    this.discount = discount;
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

  canMoveTo(next: EnrollmentManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: EnrollmentManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"enrollment manifest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.discount + this.updatedAt) * 100) / 100;
  }

  copy(): EnrollmentManifest {
    return new EnrollmentManifest(
      this.code,
      this.name,
      this.approved,
      this.startsAt,
      this.updatedAt,
      this.attributes,
      this.retries,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment manifest in status created. */
export function newEnrollmentManifest(code: string, name: string): EnrollmentManifest {
  return new EnrollmentManifest(code, name, false, 0, 0, new Map<string, string>(), 0, 0, "created");
}
