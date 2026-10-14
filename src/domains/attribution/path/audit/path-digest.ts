import * as text from "../../../../kit/text.js";

/** Where a path digest is in its life cycle. */
export type PathDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A path digest as the path team keeps it. */
export class PathDigest {
  code: string;
  name: string;
  capacity: number;
  campaignRef: string;
  retries: number;
  phone: string;
  limit: number;
  status: PathDigestStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    campaignRef: string,
    retries: number,
    phone: string,
    limit: number,
    status: PathDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.retries = retries;
    this.phone = phone;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PathDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round(this.capacity * this.retries * 100) / 100;
  }

  copy(): PathDigest {
    return new PathDigest(
      this.code,
      this.name,
      this.capacity,
      this.campaignRef,
      this.retries,
      this.phone,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a path digest in status requested. */
export function newPathDigest(code: string, name: string): PathDigest {
  return new PathDigest(code, name, 0, "", 0, "", 0, "requested");
}
