import * as text from "../../../../kit/text.js";

/** Where a primary creative digest is in its life cycle. */
export type PrimaryCreativeDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary creative digest as the creative team keeps it. */
export class PrimaryCreativeDigest {
  code: string;
  name: string;
  source: string;
  createdAt: number;
  visible: boolean;
  durationMinutes: number;
  minimum: number;
  windowDays: number;
  version: number;
  status: PrimaryCreativeDigestStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    createdAt: number,
    visible: boolean,
    durationMinutes: number,
    minimum: number,
    windowDays: number,
    version: number,
    status: PrimaryCreativeDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.createdAt = createdAt;
    this.visible = visible;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.windowDays = windowDays;
    this.version = version;
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

  canMoveTo(next: PrimaryCreativeDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryCreativeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary creative digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"primary creative digest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.version * this.minimum * 100) / 100;
  }

  copy(): PrimaryCreativeDigest {
    return new PrimaryCreativeDigest(
      this.code,
      this.name,
      this.source,
      this.createdAt,
      this.visible,
      this.durationMinutes,
      this.minimum,
      this.windowDays,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary creative digest in status proposed. */
export function newPrimaryCreativeDigest(code: string, name: string): PrimaryCreativeDigest {
  return new PrimaryCreativeDigest(code, name, "", 0, false, 0, 0, 0, 0, "proposed");
}
