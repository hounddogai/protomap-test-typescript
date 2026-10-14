import * as text from "../../../../kit/text.js";

/** Where a path claim is in its life cycle. */
export type PathClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** One path claim, with what the planners need to act on it. */
export class PathClaim {
  code: string;
  title: string;
  maximum: number;
  visible: boolean;
  externalRef: string;
  unit: string;
  durationMinutes: number;
  batchSize: number;
  openRate: number;
  status: PathClaimStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    visible: boolean,
    externalRef: string,
    unit: string,
    durationMinutes: number,
    batchSize: number,
    openRate: number,
    status: PathClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.visible = visible;
    this.externalRef = externalRef;
    this.unit = unit;
    this.durationMinutes = durationMinutes;
    this.batchSize = batchSize;
    this.openRate = openRate;
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

  canMoveTo(next: PathClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PathClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"path claim"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.batchSize - this.openRate) * 100) / 100;
  }

  copy(): PathClaim {
    return new PathClaim(
      this.code,
      this.title,
      this.maximum,
      this.visible,
      this.externalRef,
      this.unit,
      this.durationMinutes,
      this.batchSize,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a path claim in status requested. */
export function newPathClaim(code: string, title: string): PathClaim {
  return new PathClaim(code, title, 0, false, "", "", 0, 0, 0, "requested");
}
