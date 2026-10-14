import * as text from "../../../../kit/text.js";

/** Where a placement digest is in its life cycle. */
export type PlacementDigestStatus = "created" | "validated" | "published" | "retired";

/** A placement digest. Its code is unique within a tenant. */
export class PlacementDigest {
  code: string;
  name: string;
  conversionRate: number;
  unit: string;
  externalRef: string;
  ratio: number;
  status: PlacementDigestStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    unit: string,
    externalRef: string,
    ratio: number,
    status: PlacementDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.unit = unit;
    this.externalRef = externalRef;
    this.ratio = ratio;
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

  canMoveTo(next: PlacementDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netVolume(): number {
    return Math.round((this.ratio + this.conversionRate) * 100) / 100;
  }

  copy(): PlacementDigest {
    return new PlacementDigest(
      this.code,
      this.name,
      this.conversionRate,
      this.unit,
      this.externalRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a placement digest in status created. */
export function newPlacementDigest(code: string, name: string): PlacementDigest {
  return new PlacementDigest(code, name, 0, "", "", 0, "created");
}
