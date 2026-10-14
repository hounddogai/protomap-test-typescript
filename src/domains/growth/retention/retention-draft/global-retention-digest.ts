import * as text from "../../../../kit/text.js";

/** Where a global retention digest is in its life cycle. */
export type GlobalRetentionDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global retention digest. Its code is unique within a tenant. */
export class GlobalRetentionDigest {
  code: string;
  name: string;
  tags: string[];
  active: boolean;
  cohort: string;
  quantity: number;
  status: GlobalRetentionDigestStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    active: boolean,
    cohort: string,
    quantity: number,
    status: GlobalRetentionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.active = active;
    this.cohort = cohort;
    this.quantity = quantity;
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

  canMoveTo(next: GlobalRetentionDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: GlobalRetentionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global retention digest"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): GlobalRetentionDigest {
    return new GlobalRetentionDigest(
      this.code,
      this.name,
      this.tags,
      this.active,
      this.cohort,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global retention digest in status draft. */
export function newGlobalRetentionDigest(code: string, name: string): GlobalRetentionDigest {
  return new GlobalRetentionDigest(code, name, [], false, "", 0, "draft");
}
